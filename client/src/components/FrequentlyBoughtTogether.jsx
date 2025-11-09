// client/src/components/FrequentlyBoughtTogether.jsx

import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { authFetch } from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';

const FrequentlyBoughtTogether = ({ productId, currentProduct }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const { fetchCartItems } = useContext(CartContext);
  const { isDark } = useTheme();

  useEffect(() => {
    if (productId) {
      fetchRelatedProducts();
    }
  }, [productId]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/recommendations/frequently-bought-together/${productId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch related products');
      }
      
      const data = await response.json();
      setRelatedProducts(data.frequentlyBoughtTogether || []);
      
      // Initially select the current product
      setSelectedProducts(new Set([productId]));
      
    } catch (err) {
      console.error('Error fetching related products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(product._id)) {
      newSelected.delete(product._id);
    } else {
      newSelected.add(product._id);
    }
    setSelectedProducts(newSelected);
  };

  const addSelectedToCart = async () => {
    try {
      const productsToAdd = [];
      
      // Add current product if selected
      if (selectedProducts.has(productId)) {
        productsToAdd.push(currentProduct);
      }
      
      // Add related products if selected
      relatedProducts.forEach(product => {
        if (selectedProducts.has(product._id)) {
          productsToAdd.push(product);
        }
      });

      // Add each selected product to cart
      for (const product of productsToAdd) {
        const res = await authFetch('http://localhost:5000/add_to_cart', {
          method: 'POST',
          body: JSON.stringify(product),
        });

        if (!res.ok) {
          throw new Error(`Failed to add ${product.name} to cart`);
        }
      }

      fetchCartItems();
      alert(`✅ Added ${productsToAdd.length} item(s) to cart!`);
      
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('❌ Failed to add items to cart');
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;
    
    if (selectedProducts.has(productId)) {
      total += currentProduct.price;
    }
    
    relatedProducts.forEach(product => {
      if (selectedProducts.has(product._id)) {
        total += product.price;
      }
    });
    
    return total;
  };

  if (loading) {
    return (
      <div className={`mt-8 p-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="animate-pulse">Loading related products...</div>
      </div>
    );
  }

  if (error || relatedProducts.length === 0) {
    return null; // Don't show anything if no related products
  }

  return (
    <div className="mt-12">
      <div className="flex items-center mb-6">
        <div className="text-2xl mr-3">🛍️</div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Frequently Bought Together
        </h2>
      </div>
      
      <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          
          {/* Current Product */}
          <div className="relative">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedProducts.has(productId)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}
              onClick={() => toggleProductSelection(currentProduct)}
            >
              {/* Checkbox */}
              <div className="absolute top-2 right-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedProducts.has(productId)
                    ? 'bg-blue-500 border-blue-500'
                    : isDark ? 'border-gray-400' : 'border-gray-300'
                }`}>
                  {selectedProducts.has(productId) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              <img
                src={`http://localhost:5000/images/${currentProduct.image}`}
                alt={currentProduct.name}
                className="w-full h-32 object-cover mb-3 rounded"
              />
              <h3 className={`font-semibold text-sm mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {currentProduct.name}
              </h3>
              <p className="text-blue-600 font-bold">Rs.{currentProduct.price}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                This item
              </span>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.map((product) => (
            <div key={product._id} className="relative">
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedProducts.has(product._id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                }`}
                onClick={() => toggleProductSelection(product)}
              >
                {/* Checkbox */}
                <div className="absolute top-2 right-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedProducts.has(product._id)
                      ? 'bg-blue-500 border-blue-500'
                      : isDark ? 'border-gray-400' : 'border-gray-300'
                  }`}>
                    {selectedProducts.has(product._id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <Link to={`/products/${product._id}`}>
                  <img
                    src={`http://localhost:5000/images/${product.image}`}
                    alt={product.name}
                    className="w-full h-32 object-cover mb-3 rounded"
                  />
                  <h3 className={`font-semibold text-sm mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold">Rs.{product.price}</p>
                </Link>
                
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {(product.confidence * 100).toFixed(0)}% buy together
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {product.lift}x lift
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Selected to Cart */}
        <div className={`border-t pt-4 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Selected items ({selectedProducts.size})
              </p>
              <p className="text-xl font-bold text-green-600">
                Total: Rs.{calculateTotalPrice()}
              </p>
            </div>
            
            <button
              onClick={addSelectedToCart}
              disabled={selectedProducts.size === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedProducts.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Add {selectedProducts.size} item{selectedProducts.size !== 1 ? 's' : ''} to Cart
            </button>
          </div>
        </div>

        {/* AI Info */}
        <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center">
            <div className="text-lg mr-2">🤖</div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              These recommendations are powered by AI analysis of customer purchase patterns using the Apriori algorithm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;