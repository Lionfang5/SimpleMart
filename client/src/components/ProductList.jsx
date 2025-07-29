import { useContext } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { CartContext } from '../contexts/CartContext';
import { authFetch } from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';

const ProductList = ({ category }) => {
  const { data: productData, error, loading } = useFetch('http://localhost:5000/get-data');
  const { fetchCartItems } = useContext(CartContext);
  const { isDark } = useTheme();

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    try {
      const res = await authFetch('http://localhost:5000/add_to_cart', {
        method: 'POST',
        body: JSON.stringify(product),
      });

      if (!res.ok) throw new Error('Failed to add product to cart');

      await res.json();
      fetchCartItems();
    } catch (err) {
      console.error('Add to cart error:', err);
    }
  };

  const filteredProducts = productData?.filter(p => p.category === category) || [];

  return (
    <div className={`min-h-screen py-10 px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {error && (
          <div className="col-span-full text-center text-red-500 font-semibold">
            {error.message}
          </div>
        )}

        {loading && (
          <div className="col-span-full text-center text-gray-500 animate-pulse text-lg">
            Loading products...
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="col-span-full text-center text-gray-500 text-lg">
            No products found in this category.
          </div>
        )}

        {filteredProducts.map(product => (
          <Link
            key={product._id}
            to={`/products/${product._id}`}
            className="group no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div
              className={`flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-5 h-full`}
            >
              <div className="relative overflow-hidden rounded-lg mb-5">
                <img
                  src={`http://localhost:5000/images/${product.image}`}
                  alt={product.name}
                  className="w-full h-52 object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md select-none">
                  {product.category}
                </span>
              </div>

              <h2
                className={`text-xl font-semibold mb-2 ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                {product.name}
              </h2>

              <p className="text-lg font-bold text-blue-600 mb-3">${product.price.toFixed(2)}</p>

              <p
                className={`mb-3 text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Expiry: {new Date(product.expirationDate).toLocaleDateString()}
              </p>

              <div className="mb-5 flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.973a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.39 2.462a1 1 0 00-.364 1.118l1.287 3.972c.3.92-.755 1.688-1.54 1.118l-3.39-2.462a1 1 0 00-1.175 0l-3.39 2.462c-.785.57-1.838-.197-1.539-1.118l1.287-3.972a1 1 0 00-.364-1.118L2.045 9.4c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.973z" />
                </svg>
                <span
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {product.rating} / 5
                </span>
              </div>

              <button
                onClick={(e) => handleAddToCart(e, product)}
                className="mt-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-500 text-white px-5 py-3 rounded-md font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Add ${product.name} to cart`}
              >
                Add to Cart
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
