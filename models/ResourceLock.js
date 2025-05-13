const mongoose = require('mongoose');

const ResourceLockSchema = new mongoose.Schema({
  resourceName: { type: String, required: true, unique: true },
  processId: { type: String, required: true },
  lockedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null }
});

module.exports = mongoose.model('ResourceLock', ResourceLockSchema);
