import express from 'express';
import Order from '../model/Order.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/orders — create an order
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderItems, shippingAddress, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Order is empty' });
    }

    const newOrder = new Order({
      user: userId,
      orderItems,
      shippingAddress,
      totalPrice,
      orderStatus: 'Pending',
    });

    await newOrder.save();

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// GET /api/orders — get all orders (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.role || !req.user.role.includes('admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

export default router;

