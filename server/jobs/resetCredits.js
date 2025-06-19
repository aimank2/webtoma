const User = require('../models/User');
const plans = require('../config/plans'); // Assuming your plans are defined here

async function resetMonthlyCredits() {
  console.log('Starting monthly credit reset job...');
  const today = new Date();
  const users = await User.find({});

  for (const user of users) {
    const planDetails = plans[user.subscription_type];
    if (!planDetails) {
      console.warn(`No plan details found for user ${user._id} with subscription ${user.subscription_type}. Skipping.`);
      continue;
    }

    // Check if a month has passed since the last reset
    // This is a simplified check; for production, consider using a library like date-fns for more robust date calculations.
    const lastReset = user.last_reset || new Date(0); // Handle users who never had a reset
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    if (lastReset <= oneMonthAgo) {
      console.log(`Resetting credits for user ${user._id} (${user.email}) on plan ${user.subscription_type}`);
      user.credits = planDetails.monthly_credit_limit; // Reset credits to the plan's limit
      user.credits_used_this_month = 0;
      user.last_reset = today;
      try {
        await user.save();
        console.log(`Successfully reset credits for user ${user._id}`);
      } catch (error) {
        console.error(`Failed to reset credits for user ${user._id}:`, error);
      }
    } else {
      console.log(`Skipping credit reset for user ${user._id} (${user.email}), last reset was on ${user.last_reset.toISOString()}`);
    }
  }
  console.log('Monthly credit reset job finished.');
}

module.exports = resetMonthlyCredits;

// To run this job, you would typically use a scheduler like node-cron.
// Example of how to schedule it to run at midnight on the 1st of every month:
/*
const cron = require('node-cron');
const resetMonthlyCredits = require('./jobs/resetCredits'); // Adjust path as needed

// Schedule to run at 00:00 on day-of-month 1.
// See https://www.npmjs.com/package/node-cron for cron syntax details.
cron.schedule('0 0 1 * *', () => {
  console.log('Running scheduled monthly credit reset...');
  resetMonthlyCredits().catch(err => {
    console.error('Error during scheduled credit reset:', err);
  });
});
*/