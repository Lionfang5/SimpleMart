// server/routes/searchRoutes.js
import express from 'express';
import Product from '../model/Product.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    console.log('🟢 SEARCH QUERY:', query);

    // 1️⃣ Find matching products by name (case-insensitive)
    const matchedProducts = await Product.find({
      name: { $regex: query, $options: 'i' },
      isActive: true
    });

    console.log('✅ MATCHED PRODUCTS:', matchedProducts.map(p => p.name));

    if (matchedProducts.length === 0) {
      return res.json({ matched: [], related: [] });
    }

    // 2️⃣ Collect all tags & categories from matched products
    // Ensure tags exist on the products; empty array fallback
    const matchedTags = [...new Set(matchedProducts.flatMap(p => p.tags || []))];
    const matchedCategories = [...new Set(matchedProducts.map(p => p.category))];

    console.log('🏷️ TAGS FOUND:', matchedTags);
    console.log('📂 CATEGORIES FOUND:', matchedCategories);

    // 3️⃣ Find related products by tags, excluding matched products themselves
    const tagRelated = await Product.find({
      tags: { $in: matchedTags },
      _id: { $nin: matchedProducts.map(p => p._id) },
      isActive: true
    });

    console.log('🔍 TAG RELATED:', tagRelated.map(p => p.name));

    // 4️⃣ Find related products by categories excluding matched + tagRelated products
    const categoryRelated = await Product.find({
      category: { $in: matchedCategories },
      _id: { $nin: [...matchedProducts.map(p => p._id), ...tagRelated.map(p => p._id)] },
      isActive: true
    });

    console.log('📦 CATEGORY RELATED:', categoryRelated.map(p => p.name));

    // 5️⃣ Combine tagRelated and categoryRelated, limit to 10 results
    const relatedProducts = [...tagRelated, ...categoryRelated].slice(0, 10);

    console.log('✅ FINAL RELATED SENT:', relatedProducts.map(p => p.name));

    // Send matched and related products back to client
    res.json({
      matched: matchedProducts,
      related: relatedProducts
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
