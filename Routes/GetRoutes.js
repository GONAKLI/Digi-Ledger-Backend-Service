const express = require("express");
const Users = require("../Schema/Users");

const router = express.Router();

// ── GET /getCustomer/:authToken ───────────────────────────────────────────────
// Returns the full customer list (with transactions) for the authenticated user



router.get("/getCustomer/:authToken", async (req, res) => {
  try {
    const { authToken } = req.params;
  
    

    if (!authToken || typeof authToken !== "string" || authToken.trim().length === 0) {
      return res.status(400).json({ reason: "Invalid auth token" });
    }

    const user = await Users.findOne({ authToken: authToken.trim() })
      .select("Customer name profilePic")
      .lean();

  
      

    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    const customers = (user.Customer || []).map((c) => ({
      _id: c._id,
      name: c.name,
      customerPhone: c.customerPhone || null,
      address: c.address || "",
      creationDate: c.creationDate,
      transactions: (c.transactions || []).map((t) => ({
        _id: t._id,
        amount: t.amount,
        note: t.note,
        type: t.type,
        date: t.date,
      })),
    }));

    return res.status(200).json({
      customers,
      userName: user.name || "",
      profilePic: user.profilePic || "",
    });
  } catch (error) {
    console.error("[/getCustomer]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

// ── GET /getProfile/:authToken ────────────────────────────────────────────────
// Returns basic profile info (name, profilePic) for the authenticated user
router.get("/getProfile/:authToken", async (req, res) => {
  try {
    const { authToken } = req.params;

    if (!authToken || authToken.trim().length === 0) {
      return res.status(400).json({ reason: "Invalid auth token" });
    }

    const user = await Users.findOne({ authToken: authToken.trim() })
      .select("name profilePic phone appPin")
      .lean();

    if (!user) {
      return res.status(401).json({ reason: "Unauthorized" });
    }

    return res.status(200).json({
      name: user.name || "",
      profilePic: user.profilePic || "",
      phone: user.phone,
      hasPin: !!user.appPin,
    });
  } catch (error) {
    console.error("[/getProfile]", error);
    return res.status(500).json({ reason: "Internal server error" });
  }
});

module.exports = router;