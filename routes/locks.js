const express = require('express');
const router = express.Router();
const ResourceLock = require('../models/ResourceLock');

// 🛠️ Request a Lock
router.post('/request', async (req, res) => {
  const { resourceName, processId, ttlSeconds } = req.body;

  try {
    const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
    
    const existingLock = await ResourceLock.findOne({ resourceName });

    if (existingLock && existingLock.expiresAt > new Date()) {
      return res.status(409).json({ message: 'Resource is already locked.' });
    }

    await ResourceLock.findOneAndUpdate(
      { resourceName },
      { processId, lockedAt: new Date(), expiresAt },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Lock acquired successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to acquire lock.' });
  }
});

// 🛠️ Release a Lock
router.post('/release', async (req, res) => {
  const { resourceName, processId } = req.body;

  try {
    const lock = await ResourceLock.findOne({ resourceName });

    if (!lock || lock.processId !== processId) {
      return res.status(404).json({ message: 'Lock not found or unauthorized.' });
    }

    await ResourceLock.deleteOne({ resourceName });
    res.status(200).json({ message: 'Lock released successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to release lock.' });
  }
});

// 🛠️ Check if a Resource is Locked
router.get('/is-locked/:resourceName', async (req, res) => {
  const { resourceName } = req.params;

  try {
    const lock = await ResourceLock.findOne({ resourceName });

    if (lock && (!lock.expiresAt || lock.expiresAt > new Date())) {
      res.status(200).json({ is_locked: true, locked_by: lock.processId, locked_at: lock.lockedAt });
    } else {
      res.status(200).json({ is_locked: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to check lock status.' });
  }
});

// 🛠️ List All Locked Resources
router.get('/all-locked', async (req, res) => {
  try {
    const locks = await ResourceLock.find().select('resourceName processId lockedAt expiresAt');
    res.status(200).json(locks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locked resources.' });
  }
});

// 🛠️ List Resources Locked by a Specific Process
router.get('/process/:processId', async (req, res) => {
  const { processId } = req.params;

  try {
    const locks = await ResourceLock.find({ processId }).select('resourceName lockedAt expiresAt');
    res.status(200).json(locks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locks for the process.' });
  }
});

module.exports = router;
