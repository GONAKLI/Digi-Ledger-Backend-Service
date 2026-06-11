const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  note: { type: String, required: true, trim: true, default: "No note" },
  type: {
    type: String,
    required: true,
    trim: true,
    enum: ["given", "received"],
  },
  date: { type: Date, default: Date.now },
});

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  customerPhone: {
    type: Number,
    required: false,
    validate: {
      validator: (v) =>{
        if(v == null || undefined){
          return true;
        }
       return /^\d{10}$/.test(v.toString())},
      message: "Customer phone must be 10 digits",
    },
  },
  address: { type: String, trim: true, required: false },
  creationDate: { type: Date, default: Date.now },
  transactions: [TransactionSchema],
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, trim: true, default: "" },
    phone: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: (v) => /^\d{10}$/.test(v.toString()),
        message: "Phone must be 10 digits",
      },
    },
    email: { type: String, required: false, trim: true, lowercase: true },
    authToken: { type: String, required: true, unique: true },
    // Path to profile picture (served from user's own file server)
    profilePic: { type: String, trim: true, default: "" },
    // Hashed PIN for app lock (empty = disabled)
    appPin: { type: String, default: "" },
    location: { type: String, trim: true },
    creationDate: { type: Date, default: Date.now },
    Customer: [CustomerSchema],
  },
  { timestamps: true }
);

UserSchema.index({ authToken: 1 });
UserSchema.index({ phone: 1 });

const Users = mongoose.model("User", UserSchema, "User");
module.exports = Users;