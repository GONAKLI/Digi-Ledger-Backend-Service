const express = require("express");
const crypto = require("crypto");
const Otps = require("../Schema/Otp");
const Users = require("../Schema/Users");
const Feedback = require("../Schema/Feedback");

const Router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateToken = () => crypto.randomBytes(32).toString("hex");

function isValidPhone(val) {
  return /^\d{10}$/.test(String(val));
}

// Simple SHA-256 hash for PIN (no bcrypt dependency needed for a 4–6 digit PIN)
function hashPin(pin) {
  return crypto.createHash("sha256").update(String(pin)).digest("hex");
}

// ── POST /loginOtp ────────────────────────────────────────────────────────────
Router.post("/loginOtp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ reason: "Invalid phone number. Must be 10 digits." });
    }

    const phoneNumber = Number(phone);
    await Otps.findOneAndDelete({ phone: phoneNumber });

    const newOtp = new Otps({ phone: phoneNumber });
    await newOtp.save();
    // This Line should Be Fixed After Otp Service

    return res.status(200).json({ phone: phoneNumber, otp: newOtp.otp });
    
  } catch (error) {
    console.error("[/loginOtp]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /otpValidator ────────────────────────────────────────────────────────
Router.post("/otpValidator", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp || !isValidPhone(phone) || isNaN(Number(otp))) {
      return res.status(400).json({ reason: "Invalid input" });
    }

    const phoneNumber = Number(phone);
    const otpNumber = Number(otp);

    const otpRecord = await Otps.findOne({ phone: phoneNumber });
    if (!otpRecord) {
      return res.status(404).json({ reason: "OTP not found or expired", phone: phoneNumber });
    }
    if (otpRecord.otp !== otpNumber) {
      return res.status(403).json({ reason: "Wrong OTP", phone: phoneNumber });
    }

    await Otps.findOneAndDelete({ phone: phoneNumber });

    const token = generateToken();
    let user = await Users.findOne({ phone: phoneNumber });
    const isNewUser = !user;

    if (!user) {
      user = new Users({ phone: phoneNumber, authToken: token });
    } else {
      user.authToken = token;
    }
    await user.save();

    return res.status(200).json({
      reason: "Verified successfully",
      phone: phoneNumber,
      token: token,
      isNewUser,
      userName: user.name || "",
    });
  } catch (error) {
    console.error("[/otpValidator]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /addCustomer ─────────────────────────────────────────────────────────
Router.post("/addCustomer", async (req, res) => {
  try {
    const { phone, name, customerPhone, address } = req.body;

    if (!name ) {
      return res.status(400).json({ reason: "Customer Name Is Mandatory" });
    }
    if (!isValidPhone(phone) || !isValidPhone(customerPhone)) {
      return res.status(400).json({ reason: "Phone numbers must be 10 digits" });
    }

    const userPhone = Number(phone);
    const custPhone = Number(customerPhone);

    const result = await Users.findOneAndUpdate(
      { phone: userPhone },
      {
        $push: {
          Customer: {
            name: name.trim(),
            customerPhone: custPhone ? custPhone : null,
            address: address ? address.trim() : "",
          },
        },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ reason: "User not found" });
    }

    return res.status(201).json({ reason: "Customer added successfully" });
  } catch (error) {
    console.error("[/addCustomer]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /addTransaction ──────────────────────────────────────────────────────
Router.post("/addTransaction", async (req, res) => {
  try {
    const { amount, note, transactionType, phone, userToken, customerId } = req.body;

    if (!amount || !transactionType || !phone || !userToken || !customerId) {
      return res.status(400).json({ reason: "Missing required fields" });
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ reason: "Amount must be a positive number" });
    }
    if (!["given", "received"].includes(transactionType)) {
      return res.status(400).json({ reason: "transactionType must be 'given' or 'received'" });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ reason: "Invalid phone number" });
    }

    const user = await Users.findOne({ phone: Number(phone), authToken: userToken });
    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    const customer = user.Customer.id(customerId);
    if (!customer) {
      return res.status(404).json({ reason: "Customer not found" });
    }

    customer.transactions.push({
      amount: Number(amount),
      note: (note || "No note").trim(),
      type: transactionType.trim(),
    });

    await user.save();
    return res.status(201).json({ reason: "Transaction saved successfully" });
  } catch (error) {
    console.error("[/addTransaction]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /updateName ──────────────────────────────────────────────────────────
// Update the authenticated user's display name
Router.post("/updateName", async (req, res) => {
  try {
    const { authToken, name } = req.body;

    if (!authToken || !name || !name.trim()) {
      return res.status(400).json({ reason: "authToken and name are required" });
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ reason: "Name must be 2–50 characters" });
    }

    const user = await Users.findOneAndUpdate(
      { authToken },
      { name: name.trim() },
      { new: true }
    );

    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    return res.status(200).json({ reason: "Name updated", name: user.name });
  } catch (error) {
    console.error("[/updateName]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /updateProfilePic ────────────────────────────────────────────────────
// Update profile picture path (user manages their own file server)
Router.post("/updateProfilePic", async (req, res) => {
  try {
    const { authToken, profilePicPath } = req.body;

    if (!authToken || !profilePicPath || !profilePicPath.trim()) {
      return res.status(400).json({ reason: "authToken and profilePicPath are required" });
    }

    const user = await Users.findOneAndUpdate(
      { authToken },
      { profilePic: profilePicPath.trim() },
      { new: true }
    );

    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    return res.status(200).json({ reason: "Profile picture updated", profilePic: user.profilePic });
  } catch (error) {
    console.error("[/updateProfilePic]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /submitFeedback ──────────────────────────────────────────────────────
// Store user feedback (you can extend this to email it, etc.)
Router.post("/submitFeedback", async (req, res) => {
  try {
    const { authToken, feedback } = req.body;

    if (!authToken || !feedback || !feedback.trim()) {
      return res.status(400).json({ reason: "authToken and feedback are required" });
    }
    if (feedback.trim().length < 5) {
      return res.status(400).json({ reason: "Feedback too short" });
    }

    const user = await Users.findOne({ authToken });
    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    // Save feedback
    const feedbackDoc = new Feedback({
      name: user.name,
      phone: user.phone,
      message: feedback.trim(),
    });

    await feedbackDoc.save();

    return res.status(200).json({ reason: "Feedback submitted. Thank you!" });
  } catch (error) {
    console.error("[/submitFeedback]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});


// ── POST /logoutUser ──────────────────────────────────────────────────────────
// Invalidates the auth token server-side
Router.post("/logoutUser", async (req, res) => {
  try {
    const { authToken } = req.body;

    if (!authToken) {
      return res.status(400).json({ reason: "authToken is required" });
    }

    const newToken = generateToken(); // rotate token so old one is dead
    const user = await Users.findOneAndUpdate(
      { authToken },
      { authToken: newToken }
    );

    if (!user) {
      // Already logged out or invalid — still return 200 for idempotency
      return res.status(200).json({ reason: "Logged out" });
    }

    return res.status(200).json({ reason: "Logged out successfully" });
  } catch (error) {
    console.error("[/logoutUser]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /deleteAccount ───────────────────────────────────────────────────────
// Permanently deletes the user and all their data
Router.post("/deleteAccount", async (req, res) => {
  try {
    const { authToken, phone } = req.body;

    if (!authToken || !phone) {
      return res.status(400).json({ reason: "authToken and phone are required" });
    }

    const result = await Users.findOneAndDelete({
      authToken,
      phone: Number(phone),
    });

    if (!result) {
      return res.status(401).json({ reason: "Unauthorized or user not found" });
    }

    return res.status(200).json({ reason: "Account deleted successfully" });
  } catch (error) {
    console.error("[/deleteAccount]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /deleteCustomer ──────────────────────────────────────────────────────
// Removes a customer (and all their transactions) from the user's account
Router.post("/deleteCustomer", async (req, res) => {
  try {
    const { authToken, customerId } = req.body;

    if (!authToken || !customerId) {
      return res.status(400).json({ reason: "authToken and customerId are required" });
    }

    const user = await Users.findOne({ authToken });
    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    const customerIndex = user.Customer.findIndex(
      (c) => c._id.toString() === customerId
    );
    if (customerIndex === -1) {
      return res.status(404).json({ reason: "Customer not found" });
    }

    user.Customer.splice(customerIndex, 1);
    await user.save();

    return res.status(200).json({ reason: "Customer deleted successfully" });
  } catch (error) {
    console.error("[/deleteCustomer]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /setPin ──────────────────────────────────────────────────────────────
// Set or update app lock PIN (4–6 digits). Send empty pin to disable.
Router.post("/setPin", async (req, res) => {
  try {
    const { authToken, pin } = req.body;

    if (!authToken) {
      return res.status(400).json({ reason: "authToken is required" });
    }

    let pinValue = "";
    if (pin && String(pin).trim().length > 0) {
      if (!/^\d{4,6}$/.test(String(pin))) {
        return res.status(400).json({ reason: "PIN must be 4–6 digits" });
      }
      pinValue = hashPin(pin);
    }

    const user = await Users.findOneAndUpdate(
      { authToken },
      { appPin: pinValue },
      { new: true }
    );

    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    return res.status(200).json({
      reason: pinValue ? "PIN set successfully" : "PIN removed",
      hasPin: !!pinValue,
    });
  } catch (error) {
    console.error("[/setPin]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── POST /verifyPin ───────────────────────────────────────────────────────────
// Verify the app lock PIN
Router.post("/verifyPin", async (req, res) => {
  try {
    const { authToken, pin } = req.body;

    if (!authToken || !pin) {
      return res.status(400).json({ reason: "authToken and pin are required" });
    }

    const user = await Users.findOne({ authToken }).select("appPin");
    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }
    if (!user.appPin) {
      return res.status(400).json({ reason: "No PIN set" });
    }

    const hashed = hashPin(pin);
    if (hashed !== user.appPin) {
      return res.status(403).json({ reason: "Incorrect PIN" });
    }

    return res.status(200).json({ reason: "PIN verified" });
  } catch (error) {
    console.error("[/verifyPin]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

module.exports = Router;