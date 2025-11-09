// server/utils/aprioriAlgorithm.js

class AprioriAlgorithm {
  constructor(minSupport = 0.1, minConfidence = 0.6) {
    this.minSupport = minSupport;
    this.minConfidence = minConfidence;
  }

  // Generate frequent itemsets using Apriori algorithm
  generateFrequentItemsets(transactions) {
    console.log(`Starting frequent itemset generation with ${transactions.length} transactions`);
    
    const frequentItemsets = [];
    
    // Generate 1-itemsets (single items)
    const oneItemsets = this.generateOneItemsets(transactions);
    console.log(`Generated ${oneItemsets.size} unique 1-itemsets:`, Array.from(oneItemsets.keys()));
    
    const frequentOneItemsets = this.filterBySupport(oneItemsets, transactions.length);
    console.log(`Frequent 1-itemsets after filtering:`, Array.from(frequentOneItemsets.keys()));
    
    if (frequentOneItemsets.size === 0) {
      console.log('No frequent 1-itemsets found');
      return frequentItemsets;
    }
    
    frequentItemsets.push(frequentOneItemsets);
    let currentItemsets = frequentOneItemsets;
    let k = 2;

    // Generate k-itemsets until no more frequent itemsets can be found
    while (currentItemsets.size > 0 && k <= 10) { // Add safety limit
      console.log(`\nGenerating ${k}-itemsets...`);
      
      const candidateItemsets = this.generateCandidateItemsets(currentItemsets, k);
      console.log(`Generated ${candidateItemsets.size} candidate ${k}-itemsets`);
      
      // Count support for candidates
      const countedCandidates = this.countCandidateSupport(candidateItemsets, transactions);
      console.log(`Counted support for ${countedCandidates.size} candidates`);
      
      const frequentKItemsets = this.filterBySupport(countedCandidates, transactions.length);
      console.log(`Found ${frequentKItemsets.size} frequent ${k}-itemsets`);
      
      if (frequentKItemsets.size === 0) break;
      
      frequentItemsets.push(frequentKItemsets);
      currentItemsets = frequentKItemsets;
      k++;
    }

    console.log(`Total levels of frequent itemsets: ${frequentItemsets.length}`);
    return frequentItemsets;
  }

  // Generate 1-itemsets from transactions
  generateOneItemsets(transactions) {
    const itemCounts = new Map();

    transactions.forEach((transaction, idx) => {
      console.log(`Transaction ${idx + 1}:`, transaction);
      transaction.forEach(item => {
        const itemStr = item.toString().trim();
        itemCounts.set(itemStr, (itemCounts.get(itemStr) || 0) + 1);
      });
    });

    console.log('Item counts:', Object.fromEntries(itemCounts));
    return itemCounts;
  }

  // Filter itemsets by minimum support
  filterBySupport(itemsets, totalTransactions) {
    const frequentItemsets = new Map();
    const minSupportCount = Math.ceil(this.minSupport * totalTransactions);
    
    console.log(`Minimum support count: ${minSupportCount} (${this.minSupport * 100}% of ${totalTransactions})`);

    for (const [itemset, count] of itemsets) {
      if (count >= minSupportCount) {
        frequentItemsets.set(itemset, count);
        console.log(`✓ Frequent: ${Array.isArray(itemset) ? itemset.join(',') : itemset} (count: ${count})`);
      } else {
        console.log(`✗ Infrequent: ${Array.isArray(itemset) ? itemset.join(',') : itemset} (count: ${count})`);
      }
    }

    return frequentItemsets;
  }

  // Generate candidate itemsets of size k
  generateCandidateItemsets(frequentItemsets, k) {
    const candidates = new Map();
    const itemsetArray = Array.from(frequentItemsets.keys());
    
    console.log(`Generating ${k}-itemsets from ${itemsetArray.length} frequent ${k-1}-itemsets`);

    // Self-join step
    for (let i = 0; i < itemsetArray.length; i++) {
      for (let j = i + 1; j < itemsetArray.length; j++) {
        const itemset1 = Array.isArray(itemsetArray[i]) ? itemsetArray[i] : [itemsetArray[i]];
        const itemset2 = Array.isArray(itemsetArray[j]) ? itemsetArray[j] : [itemsetArray[j]];
        
        const union = this.unionItemsets(itemset1, itemset2);
        
        if (union.length === k) {
          const sortedUnion = union.sort();
          candidates.set(sortedUnion, 0);
          console.log(`Candidate ${k}-itemset: [${sortedUnion.join(', ')}]`);
        }
      }
    }

    console.log(`Generated ${candidates.size} candidate ${k}-itemsets`);
    return candidates;
  }

  // Count support for candidate itemsets
  countCandidateSupport(candidates, transactions) {
    const counted = new Map();
    
    for (const [itemset] of candidates) {
      let count = 0;
      
      transactions.forEach(transaction => {
        const transactionItems = transaction.map(item => item.toString().trim());
        const itemsetArray = Array.isArray(itemset) ? itemset : [itemset];
        
        const hasAllItems = itemsetArray.every(item => 
          transactionItems.includes(item.toString().trim())
        );
        
        if (hasAllItems) {
          count++;
        }
      });
      
      counted.set(itemset, count);
    }
    
    return counted;
  }

  // Union two itemsets
  unionItemsets(itemset1, itemset2) {
    const union = new Set([...itemset1, ...itemset2]);
    return Array.from(union);
  }

  // Generate association rules from frequent itemsets
  generateAssociationRules(frequentItemsets, transactions) {
    console.log('\nGenerating association rules...');
    const rules = [];
    const totalTransactions = transactions.length;

    // Start from 2-itemsets (need at least 2 items to create rules)
    for (let i = 1; i < frequentItemsets.length; i++) {
      const itemsets = frequentItemsets[i];
      console.log(`Processing level ${i + 1} itemsets: ${itemsets.size} itemsets`);
      
      for (const [itemset, support] of itemsets) {
        const items = Array.isArray(itemset) ? itemset : [itemset];
        
        console.log(`Processing itemset: [${items.join(', ')}] with support ${support}`);
        
        if (items.length >= 2) {
          // Generate all possible rules from this itemset
          const subsets = this.generateSubsets(items);
          console.log(`Generated ${subsets.length} subsets for rule generation`);
          
          subsets.forEach(antecedent => {
            const consequent = items.filter(item => !antecedent.includes(item));
            
            if (antecedent.length > 0 && consequent.length > 0) {
              const confidence = this.calculateConfidence(
                antecedent, 
                items, 
                frequentItemsets, 
                transactions
              );
              
              console.log(`Rule: [${antecedent.join(', ')}] => [${consequent.join(', ')}], confidence: ${confidence.toFixed(3)}`);
              
              if (confidence >= this.minConfidence) {
                const lift = this.calculateLift(antecedent, consequent, frequentItemsets, transactions);
                
                rules.push({
                  antecedent,
                  consequent,
                  support: support / totalTransactions,
                  confidence,
                  lift
                });
                
                console.log(`✓ Rule added with lift: ${lift.toFixed(3)}`);
              } else {
                console.log(`✗ Rule rejected (confidence ${confidence.toFixed(3)} < ${this.minConfidence})`);
              }
            }
          });
        }
      }
    }

    console.log(`\nGenerated ${rules.length} valid association rules`);
    return rules.sort((a, b) => b.confidence - a.confidence);
  }

  // Generate all non-empty proper subsets
  generateSubsets(items) {
    const subsets = [];
    const n = items.length;
    
    // Generate all subsets except empty set and the set itself
    for (let i = 1; i < Math.pow(2, n) - 1; i++) {
      const subset = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          subset.push(items[j]);
        }
      }
      subsets.push(subset);
    }
    
    return subsets;
  }

  // Calculate confidence for a rule
  calculateConfidence(antecedent, itemset, frequentItemsets, transactions) {
    const antecedentSupport = this.getItemsetSupport(antecedent, frequentItemsets, transactions);
    const itemsetSupport = this.getItemsetSupport(itemset, frequentItemsets, transactions);
    
    return antecedentSupport > 0 ? itemsetSupport / antecedentSupport : 0;
  }

  // Calculate lift for a rule
  calculateLift(antecedent, consequent, frequentItemsets, transactions) {
    const confidence = this.calculateConfidence(antecedent, [...antecedent, ...consequent], frequentItemsets, transactions);
    const consequentSupport = this.getItemsetSupport(consequent, frequentItemsets, transactions) / transactions.length;
    
    return consequentSupport > 0 ? confidence / consequentSupport : 0;
  }

  // Get support count for an itemset
  getItemsetSupport(itemset, frequentItemsets, transactions) {
    const searchItems = Array.isArray(itemset) ? itemset.sort() : [itemset].sort();
    
    // Search through all frequent itemsets to find the support
    for (const itemsets of frequentItemsets) {
      for (const [key, count] of itemsets) {
        const keyItems = Array.isArray(key) ? key.sort() : [key].sort();
        
        if (JSON.stringify(keyItems) === JSON.stringify(searchItems)) {
          return count;
        }
      }
    }
    
    // If not found in frequent itemsets, calculate from transactions
    const supportCount = transactions.filter(transaction => {
      const transactionItems = transaction.map(item => item.toString().trim());
      return searchItems.every(item => transactionItems.includes(item.toString().trim()));
    }).length;
    
    return supportCount;
  }

  // Main function to run Apriori algorithm
  runApriori(transactions) {
    console.log(`\n=== RUNNING APRIORI ALGORITHM ===`);
    console.log(`Transactions: ${transactions.length}`);
    console.log(`Min Support: ${this.minSupport} (${this.minSupport * 100}%)`);
    console.log(`Min Confidence: ${this.minConfidence} (${this.minConfidence * 100}%)`);
    console.log('=====================================\n');
    
    // Log sample transactions
    console.log('Sample transactions:');
    transactions.slice(0, 5).forEach((transaction, idx) => {
      console.log(`  ${idx + 1}: [${transaction.join(', ')}]`);
    });
    if (transactions.length > 5) {
      console.log(`  ... and ${transactions.length - 5} more`);
    }
    console.log('');
    
    const frequentItemsets = this.generateFrequentItemsets(transactions);
    const associationRules = this.generateAssociationRules(frequentItemsets, transactions);
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Frequent itemsets levels: ${frequentItemsets.length}`);
    console.log(`Association rules generated: ${associationRules.length}`);
    
    // Log some sample rules
    if (associationRules.length > 0) {
      console.log('\nTop association rules:');
      associationRules.slice(0, 5).forEach((rule, idx) => {
        console.log(`  ${idx + 1}: [${rule.antecedent.join(', ')}] => [${rule.consequent.join(', ')}]`);
        console.log(`     Support: ${(rule.support * 100).toFixed(1)}%, Confidence: ${(rule.confidence * 100).toFixed(1)}%, Lift: ${rule.lift.toFixed(2)}`);
      });
    }
    console.log('===============\n');
    
    return {
      frequentItemsets,
      associationRules,
      transactionCount: transactions.length
    };
  }

  // Get product recommendations based on cart items
  getRecommendations(cartItems, associationRules, maxRecommendations = 5) {
    const recommendations = new Map();
    
    // Extract product IDs from cart items
    const cartProductIds = cartItems.map(item => 
      item.productId ? item.productId.toString() : item.name
    );
    
    console.log(`Getting recommendations for cart items: [${cartProductIds.join(', ')}]`);
    
    associationRules.forEach(rule => {
      // Check if all antecedent items are in the cart
      const hasAllAntecedents = rule.antecedent.every(item => 
        cartProductIds.includes(item.toString())
      );
      
      if (hasAllAntecedents) {
        console.log(`Found matching rule: [${rule.antecedent.join(', ')}] => [${rule.consequent.join(', ')}]`);
        
        rule.consequent.forEach(item => {
          // Don't recommend items already in cart
          const alreadyInCart = cartProductIds.includes(item.toString());
          
          if (!alreadyInCart) {
            const currentScore = recommendations.get(item) || 0;
            const newScore = currentScore + (rule.confidence * rule.lift);
            recommendations.set(item, newScore);
            console.log(`  Recommending: ${item} (score: ${newScore.toFixed(3)})`);
          }
        });
      }
    });
    
    // Sort recommendations by score and return top N
    const sortedRecommendations = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxRecommendations)
      .map(([productId, score]) => ({ productId, score }));
    
    console.log(`Returning ${sortedRecommendations.length} recommendations`);
    return sortedRecommendations;
  }

  // Get frequently bought together items
  getFrequentlyBoughtTogether(productId, associationRules, maxItems = 3) {
    const relatedItems = [];
    
    console.log(`Finding items frequently bought with: ${productId}`);
    
    associationRules.forEach(rule => {
      // Check if the product is in antecedent
      if (rule.antecedent.includes(productId)) {
        rule.consequent.forEach(item => {
          if (item !== productId) {
            relatedItems.push({
              productId: item,
              confidence: rule.confidence,
              lift: rule.lift
            });
          }
        });
      }
      
      // Check if the product is in consequent
      if (rule.consequent.includes(productId)) {
        rule.antecedent.forEach(item => {
          if (item !== productId) {
            relatedItems.push({
              productId: item,
              confidence: rule.confidence,
              lift: rule.lift
            });
          }
        });
      }
    });
    
    // Remove duplicates and sort by confidence
    const uniqueItems = relatedItems.reduce((acc, item) => {
      const existing = acc.find(x => x.productId === item.productId);
      if (!existing || existing.confidence < item.confidence) {
        acc = acc.filter(x => x.productId !== item.productId);
        acc.push(item);
      }
      return acc;
    }, []);
    
    const result = uniqueItems
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxItems);
      
    console.log(`Found ${result.length} frequently bought together items`);
    return result;
  }
}

export default AprioriAlgorithm;