const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  phone: {
    type: Number,
    required: true,
    unique: true,
    validate: {
      validator: (v) => /^\d{10}$/.test(v.toString()),
      message: 'Phone must be a 10-digit number',
    },
  },
  otp: {
    type: Number,
    required: true,
    default: () => Math.floor(100000 + Math.random() * 900000), // 6-digit OTP
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // MongoDB TTL index — auto-deletes document after 10 minutes
  },
});

// Explicit index declarations (mongoose will sync these on startup)
OtpSchema.index({ phone: 1 }, { unique: true });
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const Otps = mongoose.model('Otp', OtpSchema, 'Otp');
module.exports = Otps;