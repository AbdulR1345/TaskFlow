const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const User = require('../models/User');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order
const createOrder = async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'yearly'

    // Define prices (in paise - 1 INR = 100 paise)
    const plans = {
      monthly: { amount: 19900, name: 'Premium Monthly' },   // ₹199
      yearly: { amount: 199900, name: 'Premium Yearly' }     // ₹1999
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Create order on Razorpay
    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.id,
        plan: plan
      }
    });

    // Save order in our database
    await Payment.create({
      user: req.user.id,
      razorpayOrderId: order.id,
      amount: selectedPlan.amount,
      currency: 'INR',
      status: 'created',
      plan: plan
    });

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // Create the expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: 'paid'
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Upgrade user to Premium
    const expiryDate = new Date();
    if (payment.plan === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (payment.plan === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    await User.findByIdAndUpdate(req.user.id, {
      isPremium: true,
      premiumExpiresAt: expiryDate
    });

    res.json({
      success: true,
      message: 'Payment verified successfully. You are now Premium!'
    });

  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
