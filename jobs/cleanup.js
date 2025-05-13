const cron = require('node-cron');
const ResourceLock = require('../models/ResourceLock');

cron.schedule('*/5 * * * *', async () => {
  console.log('⏳ Running cleanup for expired locks...');
  const result = await ResourceLock.deleteMany({ expiresAt: { $lt: new Date() } });
  console.log(`🗑️  Removed ${result.deletedCount} expired locks.`);
});
