const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platform: {
      type: String,
      enum: ['Careem', 'Bykea', 'Foodpanda', 'Upwork', 'Other'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hoursWorked: {
      type: Number,
      required: true,
      min: 0,
    },
    grossEarned: {
      type: Number,
      required: true,
      min: 0,
    },
    platformDeductions: {
      type: Number,
      required: true,
      min: 0,
    },
    netReceived: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['ride-hailing', 'food-delivery', 'freelance', 'domestic'],
      required: true,
    },
    screenshotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screenshot',
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['unsubmitted', 'pending', 'verified', 'flagged', 'unverifiable'],
      default: 'unsubmitted',
    },
    anomalyFlag: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', shiftSchema);
