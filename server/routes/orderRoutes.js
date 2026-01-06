// server/routes/orderRoutes.js - ENHANCED VERSION

import express from "express";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import User from "../model/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Simulate payment processing (replace with real payment gateway)
const simulatePaymentProcessing = async (paymentInfo, totalAmount) => {
  // Simulate payment delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple validation (replace with real payment validation)
  if (!paymentInfo.cardNumber || !paymentInfo.cardName || !paymentInfo.expiryDate || !paymentInfo.cvv) {
    throw new Error("Invalid payment information");
  }
  
  // Simulate 95% success rate (5% random failure for testing)
  if (Math.random() < 0.05) {
    throw new Error("Payment declined - insufficient funds");
  }
  
  return {
    success: true,
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    processingFee: totalAmount * 0.029, // 2.9% processing fee
  };
};

// Update product stock after successful order
const updateProductStock = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (product) {
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      
      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
      
      console.log(`✅ Updated stock for ${product.name}: ${product.stock + item.quantity} → ${product.stock}`);
    }
  }
};

// Auto-progress order status after certain time delays
const scheduleOrderStatusUpdates = async (orderId) => {
  // Move to processing after 1 minute (in production, this would be hours)
  setTimeout(async () => {
    try {
      await Order.findByIdAndUpdate(orderId, { status: 'processing' });
      console.log(`📦 Order ${orderId} moved to PROCESSING`);
    } catch (error) {
      console.error('Error updating order to processing:', error);
    }
  }, 60000); // 1 minute

  // Move to shipped after 3 minutes (in production, this would be days)
  setTimeout(async () => {
    try {
      await Order.findByIdAndUpdate(orderId, { status: 'shipped' });
      console.log(`🚚 Order ${orderId} moved to SHIPPED`);
    } catch (error) {
      console.error('Error updating order to shipped:', error);
    }
  }, 180000); // 3 minutes

  // Move to delivered after 5 minutes (in production, this would be a week)
  setTimeout(async () => {
    try {
      await Order.findByIdAndUpdate(orderId, { 
        status: 'delivered',
        deliveredDate: new Date()
      });
      console.log(`✅ Order ${orderId} DELIVERED - Ready for AI analysis!`);
    } catch (error) {
      console.error('Error updating order to delivered:', error);
    }
  }, 300000); // 5 minutes
};

// GET order statistics (admin only)
router.get("/admin/stats", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const orders = await Order.find().populate("userId", "email");
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const orderStats = {
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    res.json({
      totalOrders,
      totalRevenue,
      orderStats,
      orders: orders.map(order => ({
        _id: order._id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate,
        deliveredDate: order.deliveredDate,
        itemCount: order.items.length
      }))
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ error: "Failed to fetch order statistics" });
  }
});

// GET all orders (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const orders = await Order.find()
      .populate({
        path: "userId",
        select: "username email role createdAt"
      })
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

// POST create new order - ENHANCED WITH PAYMENT PROCESSING
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items, totalAmount, shippingAddress, paymentInfo } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }
    if (!shippingAddress || !paymentInfo) {
      return res.status(400).json({ message: "Shipping address and payment info required" });
    }

    const requiredShippingFields = [
      "firstName", "lastName", "email", "phone",
      "address", "city", "state", "zipCode"
    ];
    for (const field of requiredShippingFields) {
      if (!shippingAddress[field]) {
        return res.status(400).json({ message: `Shipping address ${field} is required` });
      }
    }

    console.log(`🛒 Processing order for user ${userId}, Amount: $${totalAmount}`);

    // Step 1: Check product availability and stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }
    }

    // Step 2: Process payment
    let paymentResult;
    try {
      paymentResult = await simulatePaymentProcessing(paymentInfo, totalAmount);
      console.log(`💳 Payment processed successfully: ${paymentResult.transactionId}`);
    } catch (paymentError) {
      console.error(`❌ Payment failed:`, paymentError.message);
      return res.status(400).json({ 
        message: `Payment failed: ${paymentError.message}`,
        type: 'PAYMENT_ERROR'
      });
    }

    // Step 3: Create order
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      shippingAddress,
      paymentInfo: {
        ...paymentInfo,
        transactionId: paymentResult.transactionId,
        processingFee: paymentResult.processingFee
      },
      status: "pending",
      orderDate: new Date()
    });

    await newOrder.save();
    console.log(`📋 Order created: ${newOrder._id}`);

    // Step 4: Update product stock
    try {
      await updateProductStock(items);
      console.log(`📦 Stock updated for ${items.length} products`);
    } catch (stockError) {
      // If stock update fails, we should ideally reverse the payment
      console.error(`❌ Stock update failed:`, stockError.message);
      // In a real system, you'd reverse the payment here
      await Order.findByIdAndUpdate(newOrder._id, { status: 'cancelled' });
      return res.status(400).json({ 
        message: `Order cancelled due to stock issue: ${stockError.message}`,
        type: 'STOCK_ERROR'
      });
    }

    // Step 5: Clear user's cart ONLY after successful payment and stock update
    await User.findByIdAndUpdate(userId, { $set: { cart: [] } });
    console.log(`🛒 Cart cleared for user ${userId}`);

    // Step 6: Schedule automatic status updates
    scheduleOrderStatusUpdates(newOrder._id);

    // Step 7: Populate and return order
    await newOrder.populate({
      path: "userId",
      select: "username email role"
    });

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
      paymentInfo: {
        transactionId: paymentResult.transactionId,
        processingFee: paymentResult.processingFee
      }
    });

    console.log(`✅ Order ${newOrder._id} completed successfully - will be delivered in 5 minutes for AI analysis`);

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
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const updateData = {
      status,
      ...(status === "delivered" && { deliveredDate: new Date() })
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate({
      path: "userId",
      select: "username email role"
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`📋 Order ${req.params.id} status updated to: ${status}`);

    res.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// POST - Force multiple orders to delivered status (for testing AI)
router.post("/admin/test-delivered", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Update all pending/processing orders to delivered for AI testing
    const result = await Order.updateMany(
      { status: { $in: ['pending', 'processing', 'shipped'] } },
      { 
        status: 'delivered',
        deliveredDate: new Date()
      }
    );

    console.log(`🚀 ADMIN: Force-delivered ${result.modifiedCount} orders for AI testing`);

    res.json({
      message: `Successfully marked ${result.modifiedCount} orders as delivered`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Force deliver orders error:", err);
    res.status(500).json({ error: "Failed to update orders" });
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
      .populate({
        path: "userId",
        select: "username email role"
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

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