// server/routes/recommendationRoutes.js

import express from "express";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import User from "../model/User.js";
import auth from "../middleware/auth.js";
import AprioriAlgorithm from "../utils/aprioriAlgorithm.js";

const router = express.Router();

// Global variables to store processed data (in production, use Redis or database)
let globalAssociationRules = [];
let lastProcessedTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Initialize Apriori algorithm instance with lower thresholds for small datasets
const apriori = new AprioriAlgorithm(0.15, 0.5); // 15% support, 50% confidence

// Helper function to prepare transaction data from orders
async function prepareTransactionData() {
  try {
    console.log("Preparing transaction data for Apriori analysis...");
    
    // Get all completed orders
    const orders = await Order.find({ 
      status: { $in: ['delivered', 'processing', 'shipped'] } 
    }).populate('items.productId');

    console.log(`Found ${orders.length} completed orders`);

    // Convert orders to transactions (each order = one transaction)
    const transactions = [];
    const productIdMap = new Map(); // Map to store product name mappings
    
    orders.forEach((order, orderIdx) => {
      if (order.items && order.items.length > 1) { // Only consider orders with multiple items
        const transaction = [];
        
        order.items.forEach(item => {
          let productIdentifier;
          
          if (item.productId && item.productId._id) {
            // Use product name for better readability in rules
            productIdentifier = item.productId.name || item.productId._id.toString();
            productIdMap.set(productIdentifier, item.productId._id.toString());
          } else if (item.name) {
            productIdentifier = item.name;
            productIdMap.set(productIdentifier, item.name);
          }
          
          if (productIdentifier) {
            transaction.push(productIdentifier.trim());
          }
        });
        
        // Remove duplicates in the same transaction
        const uniqueTransaction = [...new Set(transaction)];
        
        if (uniqueTransaction.length > 1) {
          transactions.push(uniqueTransaction);
          console.log(`Transaction ${transactions.length}: [${uniqueTransaction.join(', ')}]`);
        }
      }
    });

    console.log(`Generated ${transactions.length} valid transactions`);
    console.log(`Product mapping created for ${productIdMap.size} products`);
    
    // Store the mapping globally for later use
    global.productIdMap = productIdMap;
    
    return transactions;
  } catch (error) {
    console.error("Error preparing transaction data:", error);
    return [];
  }
}

// Helper function to process association rules and cache them
async function processAssociationRules(force = false) {
  try {
    // Check if we need to refresh the cache
    const now = new Date();
    if (!force && lastProcessedTime && (now - lastProcessedTime) < CACHE_DURATION) {
      console.log("Using cached association rules");
      return globalAssociationRules;
    }

    console.log("Processing new association rules...");
    
    const transactions = await prepareTransactionData();
    
    if (transactions.length < 5) { // Lower threshold for testing
      console.log(`Insufficient transaction data for meaningful analysis (need at least 5, got ${transactions.length})`);
      return [];
    }

    // Log transaction statistics
    const allItems = new Set();
    transactions.forEach(transaction => {
      transaction.forEach(item => allItems.add(item));
    });
    
    console.log(`Transaction statistics:`);
    console.log(`- Total transactions: ${transactions.length}`);
    console.log(`- Unique items: ${allItems.size}`);
    console.log(`- Items: [${Array.from(allItems).join(', ')}]`);
    console.log(`- Average items per transaction: ${(transactions.reduce((sum, t) => sum + t.length, 0) / transactions.length).toFixed(2)}`);

    // Run Apriori algorithm
    const result = apriori.runApriori(transactions);
    globalAssociationRules = result.associationRules;
    lastProcessedTime = now;

    console.log(`Generated ${globalAssociationRules.length} association rules`);
    
    // Log some example rules
    if (globalAssociationRules.length > 0) {
      console.log('\nExample association rules:');
      globalAssociationRules.slice(0, 3).forEach((rule, idx) => {
        console.log(`${idx + 1}. [${rule.antecedent.join(', ')}] => [${rule.consequent.join(', ')}]`);
        console.log(`   Support: ${(rule.support * 100).toFixed(1)}%, Confidence: ${(rule.confidence * 100).toFixed(1)}%, Lift: ${rule.lift.toFixed(2)}`);
      });
    }
    
    return globalAssociationRules;
  } catch (error) {
    console.error("Error processing association rules:", error);
    return [];
  }
}

// Helper function to find product by name or ID
async function findProductByIdentifier(identifier) {
  try {
    // Try to find by ObjectId first
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      const product = await Product.findById(identifier);
      if (product) return product;
    }
    
    // Try to find by name
    const product = await Product.findOne({ 
      name: { $regex: new RegExp(identifier, 'i') },
      isActive: true 
    });
    
    return product;
  } catch (error) {
    console.log(`Error finding product for identifier: ${identifier}`, error.message);
    return null;
  }
}

// GET recommendations based on user's cart
router.get("/cart-recommendations", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's current cart
    const user = await User.findById(userId);
    if (!user || !user.cart || user.cart.length === 0) {
      return res.json({ recommendations: [], message: "Cart is empty" });
    }

    console.log(`Getting cart recommendations for user ${userId}`);
    console.log(`Cart items: ${user.cart.length}`);

    // Process association rules if needed
    const rules = await processAssociationRules();
    
    if (rules.length === 0) {
      return res.json({ 
        recommendations: [], 
        message: "Insufficient data for recommendations. Add more orders to improve recommendations." 
      });
    }

    // Prepare cart items for recommendation engine
    const cartItems = user.cart.map(item => ({
      productId: item.productId ? item.productId.toString() : null,
      name: item.name || 'Unknown'
    }));

    // Get recommendations using Apriori
    const recommendations = apriori.getRecommendations(cartItems, rules, 6);
    
    console.log(`Generated ${recommendations.length} raw recommendations`);

    // Fetch product details for recommended items
    const recommendedProducts = [];
    
    for (const rec of recommendations) {
      try {
        const product = await findProductByIdentifier(rec.productId);
        if (product && product.isActive) {
          recommendedProducts.push({
            ...product.toObject(),
            recommendationScore: rec.score.toFixed(3)
          });
          console.log(`✓ Added recommendation: ${product.name} (score: ${rec.score.toFixed(3)})`);
        } else {
          console.log(`✗ Product not found or inactive: ${rec.productId}`);
        }
      } catch (error) {
        console.log(`Error processing recommendation: ${rec.productId}`, error.message);
      }
    }

    res.json({
      recommendations: recommendedProducts,
      message: `Found ${recommendedProducts.length} recommendations based on your cart`,
      debug: {
        totalRules: rules.length,
        cartItemCount: cartItems.length,
        rawRecommendations: recommendations.length
      }
    });

  } catch (error) {
    console.error("Cart recommendations error:", error);
    res.status(500).json({ error: "Failed to get cart recommendations" });
  }
});

// GET frequently bought together items for a specific product
router.get("/frequently-bought-together/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log(`Getting frequently bought together items for: ${product.name} (${productId})`);

    // Process association rules if needed
    const rules = await processAssociationRules();
    
    if (rules.length === 0) {
      return res.json({ 
        frequentlyBoughtTogether: [], 
        message: "Insufficient data for analysis. Need more order history." 
      });
    }

    // Try both product ID and product name for matching
    const identifiers = [productId, product.name];
    let relatedItems = [];
    
    identifiers.forEach(identifier => {
      const items = apriori.getFrequentlyBoughtTogether(identifier, rules, 4);
      relatedItems = relatedItems.concat(items);
    });

    // Remove duplicates
    const uniqueItems = relatedItems.reduce((acc, item) => {
      const existing = acc.find(x => x.productId === item.productId);
      if (!existing || existing.confidence < item.confidence) {
        acc = acc.filter(x => x.productId !== item.productId);
        acc.push(item);
      }
      return acc;
    }, []);

    console.log(`Found ${uniqueItems.length} related items`);
    
    // Fetch product details
    const relatedProducts = [];
    
    for (const item of uniqueItems) {
      try {
        const relatedProduct = await findProductByIdentifier(item.productId);
        if (relatedProduct && relatedProduct.isActive) {
          relatedProducts.push({
            ...relatedProduct.toObject(),
            confidence: item.confidence.toFixed(3),
            lift: item.lift.toFixed(3)
          });
          console.log(`✓ Related product: ${relatedProduct.name}`);
        }
      } catch (error) {
        console.log(`Error finding related product: ${item.productId}`, error.message);
      }
    }

    res.json({
      frequentlyBoughtTogether: relatedProducts,
      currentProduct: product,
      message: `Found ${relatedProducts.length} items frequently bought together`,
      debug: {
        totalRules: rules.length,
        searchIdentifiers: identifiers,
        rawMatches: uniqueItems.length
      }
    });

  } catch (error) {
    console.error("Frequently bought together error:", error);
    res.status(500).json({ error: "Failed to get frequently bought together items" });
  }
});

// GET personalized recommendations based on user's purchase history
router.get("/personalized", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's order history
    const userOrders = await Order.find({ 
      userId, 
      status: { $in: ['delivered', 'processing', 'shipped'] } 
    }).populate('items.productId');

    if (userOrders.length === 0) {
      return res.json({ 
        recommendations: [], 
        message: "No order history available for personalized recommendations" 
      });
    }

    console.log(`Getting personalized recommendations for user ${userId}`);
    console.log(`User has ${userOrders.length} completed orders`);

    // Get all products user has purchased
    const purchasedProducts = [];
    userOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          purchasedProducts.push({
            productId: item.productId._id ? item.productId._id.toString() : item.productId,
            name: item.productId.name || item.name
          });
        } else if (item.name) {
          purchasedProducts.push({
            productId: item.name,
            name: item.name
          });
        }
      });
    });

    console.log(`User has purchased ${purchasedProducts.length} items (including duplicates)`);

    // Process association rules if needed
    const rules = await processAssociationRules();
    
    if (rules.length === 0) {
      return res.json({ 
        recommendations: [], 
        message: "Insufficient data for personalized recommendations. Need more order data." 
      });
    }

    // Get recommendations based on purchase history
    const recommendations = apriori.getRecommendations(purchasedProducts, rules, 8);
    
    console.log(`Generated ${recommendations.length} personalized recommendations`);
    
    // Fetch product details
    const recommendedProducts = [];
    
    for (const rec of recommendations) {
      try {
        const product = await findProductByIdentifier(rec.productId);
        if (product && product.isActive) {
          recommendedProducts.push({
            ...product.toObject(),
            recommendationScore: rec.score.toFixed(3)
          });
          console.log(`✓ Personalized recommendation: ${product.name} (score: ${rec.score.toFixed(3)})`);
        } else {
          console.log(`✗ Product not found or inactive: ${rec.productId}`);
        }
      } catch (error) {
        console.log(`Error processing personalized recommendation: ${rec.productId}`, error.message);
      }
    }

    res.json({
      recommendations: recommendedProducts,
      message: `Found ${recommendedProducts.length} personalized recommendations`,
      debug: {
        totalRules: rules.length,
        userOrders: userOrders.length,
        purchasedItems: purchasedProducts.length,
        rawRecommendations: recommendations.length
      }
    });

  } catch (error) {
    console.error("Personalized recommendations error:", error);
    res.status(500).json({ error: "Failed to get personalized recommendations" });
  }
});

// GET trending product combinations
router.get("/trending-combinations", async (req, res) => {
  try {
    console.log("Getting trending product combinations...");
    
    // Process association rules if needed
    const rules = await processAssociationRules();
    
    if (rules.length === 0) {
      return res.json({ 
        combinations: [], 
        message: "Insufficient data for trending combinations. Need more order history." 
      });
    }

    console.log(`Processing ${rules.length} rules for trending combinations`);

    // Get top combinations with high confidence and lift
    const topCombinations = rules
      .filter(rule => rule.confidence > 0.3 && rule.lift > 1.0) // Lower thresholds for small dataset
      .slice(0, 10)
      .map(rule => ({
        antecedent: rule.antecedent,
        consequent: rule.consequent,
        confidence: rule.confidence.toFixed(3),
        support: rule.support.toFixed(3),
        lift: rule.lift.toFixed(3)
      }));

    console.log(`Found ${topCombinations.length} qualifying combinations`);

    // Fetch product details for each combination
    const combinationsWithProducts = [];
    
    for (const combo of topCombinations) {
      try {
        const antecedentProducts = [];
        const consequentProducts = [];
        
        // Find antecedent products
        for (const identifier of combo.antecedent) {
          const product = await findProductByIdentifier(identifier);
          if (product && product.isActive) {
            antecedentProducts.push(product);
          }
        }
        
        // Find consequent products
        for (const identifier of combo.consequent) {
          const product = await findProductByIdentifier(identifier);
          if (product && product.isActive) {
            consequentProducts.push(product);
          }
        }

        if (antecedentProducts.length > 0 && consequentProducts.length > 0) {
          combinationsWithProducts.push({
            antecedentProducts,
            consequentProducts,
            confidence: combo.confidence,
            support: combo.support,
            lift: combo.lift
          });
          
          console.log(`✓ Combination: [${antecedentProducts.map(p => p.name).join(', ')}] => [${consequentProducts.map(p => p.name).join(', ')}]`);
        }
      } catch (error) {
        console.log("Error fetching combination products:", error.message);
      }
    }

    res.json({
      combinations: combinationsWithProducts,
      message: `Found ${combinationsWithProducts.length} trending combinations`,
      debug: {
        totalRules: rules.length,
        qualifyingRules: topCombinations.length,
        finalCombinations: combinationsWithProducts.length
      }
    });

  } catch (error) {
    console.error("Trending combinations error:", error);
    res.status(500).json({ error: "Failed to get trending combinations" });
  }
});

// POST force refresh association rules (admin only)
router.post("/refresh-rules", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    console.log("Force refreshing association rules...");
    const rules = await processAssociationRules(true);
    
    res.json({
      message: "Association rules refreshed successfully",
      rulesCount: rules.length,
      lastProcessed: lastProcessedTime,
      debug: {
        minSupport: apriori.minSupport,
        minConfidence: apriori.minConfidence
      }
    });

  } catch (error) {
    console.error("Refresh rules error:", error);
    res.status(500).json({ error: "Failed to refresh association rules" });
  }
});

// GET analytics about recommendations (admin only)
router.get("/analytics", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ 
      status: { $in: ['delivered', 'processing', 'shipped'] } 
    });

    // Get transaction statistics
    const transactions = await prepareTransactionData();
    
    // Get unique items across all transactions
    const allItems = new Set();
    transactions.forEach(transaction => {
      transaction.forEach(item => allItems.add(item));
    });

    // Calculate item frequency
    const itemFrequency = {};
    transactions.forEach(transaction => {
      transaction.forEach(item => {
        itemFrequency[item] = (itemFrequency[item] || 0) + 1;
      });
    });

    res.json({
      totalOrders,
      completedOrders,
      validTransactions: transactions.length,
      associationRules: globalAssociationRules.length,
      uniqueItems: allItems.size,
      lastProcessed: lastProcessedTime,
      cacheAge: lastProcessedTime ? 
        Math.floor((new Date() - lastProcessedTime) / 1000 / 60) + " minutes" : 
        "Never processed",
      averageItemsPerTransaction: transactions.length > 0 ? 
        (transactions.reduce((sum, t) => sum + t.length, 0) / transactions.length).toFixed(2) : 
        0,
      algorithmSettings: {
        minSupport: apriori.minSupport,
        minConfidence: apriori.minConfidence
      },
      itemFrequency: Object.entries(itemFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [item, count]) => {
          obj[item] = count;
          return obj;
        }, {}),
      sampleTransactions: transactions.slice(0, 5)
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// GET debug endpoint to see current rules (admin only)
router.get("/debug", auth, async (req, res) => {
  try {
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const rules = await processAssociationRules();
    
    res.json({
      rulesCount: rules.length,
      rules: rules.map(rule => ({
        antecedent: rule.antecedent,
        consequent: rule.consequent,
        support: (rule.support * 100).toFixed(1) + '%',
        confidence: (rule.confidence * 100).toFixed(1) + '%',
        lift: rule.lift.toFixed(2)
      })),
      settings: {
        minSupport: apriori.minSupport,
        minConfidence: apriori.minConfidence
      }
    });

  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: "Failed to get debug info" });
  }
});

// Initialize association rules on server start
processAssociationRules().then(() => {
  console.log("Initial association rules processing completed");
}).catch(error => {
  console.error("Failed to initialize association rules:", error);
});

export default router;