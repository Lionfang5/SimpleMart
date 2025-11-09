// client/src/components/RecommendationsSection.jsx

import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { authFetch } from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';

const RecommendationsSection = ({ userId }) => {
  const [cartRecommendations, setCartRecommendations] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [trendingCombinations, setTrendingCombinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchCartItems } = useContext(CartContext);
  const { isDark } = useTheme();

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // Fetch different types of recommendations
      const [cartRes, personalizedRes, trendingRes] = await Promise.allSettled([
        authFetch('http://localhost:5000/recommendations/cart-recommendations'),
        authFetch('http://localhost:5000/recommendations/personalized'),
        fetch('http://localhost:5000/recommendations/trending-combinations')
      ]);

      // Process cart recommendations
      if (cartRes.status === 'fulfilled' && cartRes.value.ok) {
        const cartData = await cartRes.value.json();
        setCartRecommendations(cartData.recommendations || []);
      }

      // Process personalized recommendations
      if (personalizedRes.status === 'fulfilled' && personalizedRes.value.ok) {
        const personalizedData = await personalizedRes.value.json();
        setPersonalizedRecommendations(personalizedData.recommendations || []);
      }

      // Process trending combinations
      if (trendingRes.status === 'fulfilled' && trendingRes.value.ok) {
        const trendingData = await trendingRes.value.json();
        setTrendingCombinations(trendingData.combinations || []);
      }

    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const addToCartHandle = async (product) => {
    try {
      const res = await authFetch('http://localhost:5000/add_to_cart', {
        method: 'POST',
        body: JSON.stringify(product),
      });

      if (!res.ok) throw new Error('Failed to add to cart');
      
      fetchCartItems();
      // Refresh recommendations after adding to cart
      setTimeout(() => fetchRecommendations(), 1000);
    } catch (err) {
      console.error('Add to cart error:', err);
    }
  };

  if (loading) {
    return (
      <div className={`max-w-6xl mx-auto px-4 py-8 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
        <div className="text-center">Loading recommendations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-6xl mx-auto px-4 py-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
        <div className="text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Cart-based Recommendations */}
      {cartRecommendations.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">🛒</div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Recommended for Your Cart
            </h2>
          </div>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Based on items in your cart, customers also purchased:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cartRecommendations.map((product) => (
              <div
                key={product._id}
                className={`rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <Link to={`/products/${product._id}`}>
                  <img
                    src={`http://localhost:5000/images/${product.image}`}
                    alt={product.name}
                    className="w-full h-40 object-cover mb-3 rounded-lg"
                  />
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {product.name}
                  </h3>
                  <p className={`text-sm mb-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Category: {product.category}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xl font-bold text-blue-600">
                      Rs.{product.price}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                    }`}>
                      Match: {(product.recommendationScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCartHandle(product);
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {personalizedRecommendations.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">⭐</div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Recommended for You
            </h2>
          </div>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Based on your purchase history:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {personalizedRecommendations.slice(0, 4).map((product) => (
              <div
                key={product._id}
                className={`rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <Link to={`/products/${product._id}`}>
                  <img
                    src={`http://localhost:5000/images/${product.image}`}
                    alt={product.name}
                    className="w-full h-40 object-cover mb-3 rounded-lg"
                  />
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {product.name}
                  </h3>
                  <p className={`text-sm mb-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Category: {product.category}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xl font-bold text-blue-600">
                      Rs.{product.price}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'
                    }`}>
                      Score: {(product.recommendationScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCartHandle(product);
                  }}
                  className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Combinations */}
      {trendingCombinations.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">🔥</div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Trending Product Combinations
            </h2>
          </div>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Popular products bought together by other customers:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trendingCombinations.slice(0, 4).map((combination, index) => (
              <div
                key={index}
                className={`rounded-lg shadow-md p-6 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Frequently Bought Together
                  </h3>
                  <div className="flex space-x-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      isDark ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {(combination.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Antecedent Products */}
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Customers who bought:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {combination.antecedentProducts.map((product, idx) => (
                        <Link
                          key={product._id}
                          to={`/products/${product._id}`}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <img
                            src={`http://localhost:5000/images/${product.image}`}
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <span className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {product.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-2xl text-gray-400">→</div>

                  {/* Consequent Products */}
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Also purchased:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {combination.consequentProducts.map((product, idx) => (
                        <Link
                          key={product._id}
                          to={`/products/${product._id}`}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'border-blue-600 bg-blue-900 hover:bg-blue-800' 
                              : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                          } transition-colors`}
                        >
                          <img
                            src={`http://localhost:5000/images/${product.image}`}
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <span className={`text-sm ${
                            isDark ? 'text-blue-300' : 'text-blue-700'
                          }`}>
                            {product.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No recommendations message */}
      {cartRecommendations.length === 0 && 
       personalizedRecommendations.length === 0 && 
       trendingCombinations.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">AI-Powered Recommendations Coming Soon!</h3>
          <p className="mb-4">
            Add items to your cart or make some purchases to see personalized recommendations.
          </p>
          <p className="text-sm">
            Our AI is learning from customer behavior to provide you with the best product suggestions.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;