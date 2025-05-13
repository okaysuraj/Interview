// controllers/lockController.js
const ResourceLock = require('../models/ResourceLock');
const mongoose = require('mongoose');

// Request a lock for a resource
const requestLock = async (req, res) => {
  try {
    const { processId, resourceName, ttl_seconds } = req.body;

    // Check if the lock is already held and not expired
    const existingLock = await ResourceLock.findOne({ resourceName });

    if (existingLock) {
      const isExpired = new Date() > new Date(existingLock.expiresAt);
      if (!isExpired) {
        return res.status(409).json({
          message: `Resource '${resourceName}' is already locked by Process ID '${existingLock.processId}'.`,
        });
      } else {
        // If expired, remove the existing lock
        await ResourceLock.deleteOne({ resourceName });
      }
    }

    // Calculate expiration timestamp
    const expiresAt = ttl_seconds
      ? new Date(Date.now() + ttl_seconds * 1000)
      : null;

    // Create new lock
    const newLock = new ResourceLock({
      processId,
      resourceName,
      lockedAt: new Date(),
      expiresAt,
    });

    await newLock.save();
    res.status(201).json({ message: 'Lock acquired successfully.', lock: newLock });

  } catch (err) {
    res.status(500).json({ message: 'Error requesting lock.', error: err.message });
  }
};

const releaseLock = async (req, res) => {
  try {
    const { processId, resourceName } = req.body;

    // Find and delete the lock
    const result = await ResourceLock.findOneAndDelete({ processId, resourceName });

    if (result) {
      res.status(200).json({ message: `Lock on resource '${resourceName}' released.` });
    } else {
      res.status(404).json({ message: 'No lock found for this resource and process ID.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error releasing lock.', error: err.message });
  }
};

const checkLock = async (req, res) => {
  try {
    const { resourceName } = req.params;

    const resourceLock = await ResourceLock.findOne({ resourceName });

    if (resourceLock) {
      const isExpired = resourceLock.expiresAt && new Date() > new Date(resourceLock.expiresAt);

      res.status(200).json({
        resource_name: resourceName,
        is_locked: !isExpired,
        locked_by: resourceLock.processId,
        locked_at: resourceLock.lockedAt,
        expires_at: resourceLock.expiresAt,
      });
    } else {
      res.status(200).json({ resource_name: resourceName, is_locked: false });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error checking lock.', error: err.message });
  }
};

const getAllLockedResources = async (req, res) => {
  try {
    const lockedResources = await ResourceLock.find();
    const response = lockedResources.map(lock => ({
      resource_name: lock.resourceName,
      locked_by: lock.processId,
      locked_at: lock.lockedAt,
      expires_at: lock.expiresAt,
    }));
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching locked resources.', error: err.message });
  }
};

const getResourcesLockedByProcess = async (req, res) => {
  try {
    const { processId } = req.params;
    const resources = await ResourceLock.find({ processId });

    if (resources.length > 0) {
      const response = resources.map(lock => ({
        resource_name: lock.resourceName,
        locked_at: lock.lockedAt,
        expires_at: lock.expiresAt,
      }));
      res.status(200).json(response);
    } else {
      res.status(404).json({ message: `No resources found locked by Process ID '${processId}'.` });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching resources.', error: err.message });
  }
};

module.exports = {
  requestLock,
  releaseLock,
  checkLock,
  getAllLockedResources,
  getResourcesLockedByProcess,
};
