import express from "express";
import Product from "../model/Product.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ✅ MERGED SEARCH ROUTE WITH TAG SUPPORT
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query || "";
    const regex = new RegExp(query, "i"); // case-insensitive

    // 1️⃣ Find products by name, category, or description
    const matched = await Product.find({
      $or: [
        { name: regex },
        { category: regex },
        { description: regex }
      ],
      isActive: true
    }).limit(10);

    if (matched.length === 0) {
      return res.json({ matched: [], related: [] });
    }

    // 2️⃣ Collect tags from matched products
    const matchedTags = [...new Set(matched.flatMap(p => p.tags || []))];

    // 3️⃣ Find related products:
    // - Share tags OR same category
    // - Not the ones already matched
    const related = await Product.find({
      $or: [
        { tags: { $in: matchedTags } },
        { category: { $in: matched.map(p => p.category) } }
      ],
      _id: { $nin: matched.map(p => p._id) },
      isActive: true
    }).limit(10);

    res.json({ matched, related });
  } catch (err) {
    console.error("🔥 Search error:", err);
    res.status(500).json({ error: "Server error while searching products" });
  }
});

// ✅ GET all products
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ GET product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Invalid product ID" });
  }
});

// ✅ POST create product
router.post("/", auth, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ✅ PUT update product
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ✅ DELETE product
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
