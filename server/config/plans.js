const PLANS = {
  free: {
    name: "Free",
    monthly_credit_limit: 20, // 20,000 tokens
    price_monthly: 0,
  },
  trial: {
    // Example: if you offer a trial with more credits than free
    name: "Trial",
    monthly_credit_limit: 50,
    price_monthly: 0, // Or a one-time aspect
    duration_days: 30, // Optional: if trial has an expiry
  },
  starter: {
    name: "Starter",
    monthly_credit_limit: 100, // 100,000 tokens
    price_monthly: 7.99,
  },
  pro: {
    name: "Pro",
    monthly_credit_limit: 500, // 500,000 tokens
    price_monthly: 19.99,
  },
  elite: {
    name: "Elite",
    monthly_credit_limit: 1000, // 1,000,000 tokens
    price_monthly: 39.99,
  },
};

const DEFAULT_PLAN = "free";

// Helper function to get plan details
function getPlanDetails(planKey) {
  return PLANS[planKey] || PLANS[DEFAULT_PLAN];
}

module.exports = {
  PLANS,
  DEFAULT_PLAN,
  getPlanDetails,
};
