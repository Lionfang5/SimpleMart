import express from "express";
import Comment from "../model/Comment.js";

const router = express.Router();

// ✅ Get all comments for a product
router.get("/:productId", async (req, res) => {
  try {
    const comments = await Comment.find({ productId: req.params.productId });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// ✅ Post a comment
router.post("/", async (req, res) => {
  try {
    const { productId, user, text } = req.body;
    const newComment = new Comment({ productId, user, text });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: "Failed to save comment" });
  }
});

export default router;
