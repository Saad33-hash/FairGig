const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    platform: {
      type: String,
      enum: ['Careem', 'Bykea', 'Foodpanda', 'Upwork', 'Other'],
      required: true,
    },
    category: {
      type: String,
      enum: ['commission-change', 'deactivation', 'payment-delay', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'escalated', 'resolved'],
      default: 'open',
    },
    advocateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    advocateNote: {
      type: String,
      default: '',
    },
    clusterGroup: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Grievance', grievanceSchema);
