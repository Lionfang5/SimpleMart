import express from "express";
import Order from "../model/Order.js";
import User from "../model/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET all orders (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const orders = await Order.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET orders for current user
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error("Fetch user orders error:", err);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

// POST create new order
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      items, 
      totalAmount, 
      shippingAddress, 
      paymentInfo 
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address required" });
    }

    // Create new order
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      shippingAddress,
      paymentInfo,
      status: 'pending'
    });

    await newOrder.save();

    // Clear user's cart after successful order
    await User.findByIdAndUpdate(userId, { $set: { cart: [] } });

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder
    });

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// PUT update order status (admin only)
router.put("/:id/status", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'delivered' && { deliveredDate: new Date() })
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// DELETE order (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });

  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// GET single order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'username email');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Users can only see their own orders, admins can see all
    if (!req.user.role.includes("admin") && order.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);

  } catch (err) {
    console.error("Fetch order error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;