import express from "express";
import Product from "../model/Product.js";

const router = express.Router();

// Search route with improved functionality
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query || "";
    
    if (!query.trim()) {
      return res.json({ matched: [], related: [] });
    }

    const regex = new RegExp(query.trim(), "i"); // case-insensitive

    // 1️⃣ Find products by name, category, or description
    const matched = await Product.find({
      $or: [
        { name: regex },
        { category: regex },
        { description: regex },
        { tags: { $in: [regex] } } // Search in tags array if it exists
      ],
      isActive: { $ne: false } // Only active products
    }).limit(20);

    if (matched.length === 0) {
      return res.json({ matched: [], related: [] });
    }

    // 2️⃣ Collect categories and tags from matched products
    const matchedCategories = [...new Set(matched.map(p => p.category))];
    const matchedTags = [...new Set(matched.flatMap(p => p.tags || []))];

    // 3️⃣ Find related products:
    // - Share tags OR same category
    // - Not the ones already matched
    const related = await Product.find({
      $or: [
        { category: { $in: matchedCategories } },
        { tags: { $in: matchedTags } }
      ],
      _id: { $nin: matched.map(p => p._id) },
      isActive: { $ne: false }
    }).limit(10);

    res.json({ matched, related });
  } catch (err) {
    console.error("🔥 Search error:", err);
    res.status(500).json({ 
      error: "Server error while searching products",
      matched: [],
      related: []
    });
  }
});

export default router;