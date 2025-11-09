import express from "express";
import User from "../model/User.js";
import Order from "../model/Order.js";
import auth from "../middleware/auth.js";
import bcrypt from "bcrypt";

const router = express.Router();

// GET user(s) data (admin sees all, user sees self)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role.includes("admin")) {
      const users = await User.find().select("-password");
      return res.json(users);
    }

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// PUT update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user.userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { username, email },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST change password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await User.findByIdAndUpdate(req.user.userId, {
      password: hashedNewPassword
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// GET export user data
router.get("/export-data", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    const orders = await Order.find({ userId: req.user.userId });

    const exportData = {
      profile: user,
      orders: orders,
      exportDate: new Date().toISOString(),
      dataTypes: ['profile', 'orders', 'cart']
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="my-data-export.json"');
    res.json(exportData);
  } catch (err) {
    console.error("Export data error:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// DELETE delete account
router.delete("/delete-account", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Delete user's orders
    await Order.deleteMany({ userId });
    
    // Delete user account
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// DELETE user by ID (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const userId = req.params.id;
    
    // Don't allow admin to delete themselves
    if (userId === req.user.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Delete user's orders
    await Order.deleteMany({ userId });
    
    // Delete user
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// PUT update user by ID (admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { username, email, role } = req.body;
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "User updated successfully",
      user: updated
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// GET user dashboard stats
router.get("/dashboard-stats", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's orders
    const orders = await Order.find({ userId });
    
    // Calculate stats
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter(order => 
      ['pending', 'processing'].includes(order.status)
    ).length;
    const completedOrders = orders.filter(order => 
      order.status === 'delivered'
    ).length;
    
    // Recent orders (last 5)
    const recentOrders = orders
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 5);
    
    res.json({
      totalOrders,
      totalSpent,
      pendingOrders,
      completedOrders,
      recentOrders,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// GET user profile with orders
router.get("/profile-with-orders", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user,
      orders,
      orderCount: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0)
    });
  } catch (err) {
    console.error("Profile with orders error:", err);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

export default router;