import useFetch from "../hooks/useFetch";
import { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { authFetch } from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

const ProductList = ({ category, search = '' }) => {  // Added search prop, default ''
  const { data: productData, error } = useFetch('http://localhost:5000/get-data');
  const { fetchCartItems } = useContext(CartContext);
  const { isDark } = useTheme();

  const addToCartHandle = (e, product) => {
    e.preventDefault(); // Prevent navigation when clicking the button inside Link

    authFetch('http://localhost:5000/add_to_cart', {
      method: 'POST',
      body: JSON.stringify(product),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network error while adding to cart');
        }
        return res.json();
      })
      .then(() => {
        fetchCartItems();
      })
      .catch((err) => {
        console.error('Add to cart error:', err);
      });
  };

  if (!productData) {
    // Optional: loading state while fetching products
    return (
      <div className={`min-h-screen py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-5xl mx-auto text-center text-gray-500">Loading products...</div>
      </div>
    );
  }

  // Filter products by category first
  const productsInCategory = productData.filter(product => product.category === category);

  // Filtered products by search term (if search is empty, all category products)
  const filteredProducts = search
    ? productsInCategory.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
      )
    : productsInCategory;

  // IDs of filtered products
  const filteredProductIds = new Set(filteredProducts.map(p => p._id));

  // Related products exclude filtered ones
  const relatedProducts = productsInCategory.filter(p => !filteredProductIds.has(p._id));

  return (
    <div className={`min-h-screen py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Show error if any */}
      {error && <h1 className="col-span-full text-red-600 text-center">{error.message}</h1>}

      {/* Main filtered products grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="no-underline"
            >
              <div className={`rounded-lg shadow p-6 flex flex-col items-start hover:shadow-lg transition cursor-pointer ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}>
                <img src={`http://localhost:5000/images/${product.image}`} alt={product.name} className="w-full h-48 object-cover mb-4 rounded-lg" />
                <p className={`text-lg font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{product.name}</p>
                <p className={`mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Price: <span className="font-medium">${product.price}</span></p>
                <p className={`mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{product.category}</p>
                <p className={`mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{new Date(product.expirationDate).toLocaleDateString()}</p>
                <p className={`mb-1 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Rating: <span className="font-medium">{product.rating} / 5</span></p>
                <button
                  onClick={(e) => addToCartHandle(e, product)}
                  className="mt-auto bg-blue-500 hover:bg-blue-600 active:bg-blue-300 text-white px-4 py-2 rounded transition"
                >
                  Add to cart
                </button>
              </div>
            </Link>
          ))
        ) : (
          <p className={`col-span-full text-center text-gray-500`}>
            No products found matching "{search}"
          </p>
        )}
      </div>

      {/* Show related products if search term exists and related products available */}
      {search && relatedProducts.length > 0 && (
        <div className="max-w-5xl mx-auto mt-12">
          <h2 className={`mb-6 text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            You may also like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map(product => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="no-underline"
              >
                <div className={`rounded-lg shadow p-6 flex flex-col items-start hover:shadow-lg transition cursor-pointer ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <img src={`http://localhost:5000/images/${product.image}`} alt={product.name} className="w-full h-48 object-cover mb-4 rounded-lg" />
                  <p className={`text-lg font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{product.name}</p>
                  <p className={`mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Price: <span className="font-medium">${product.price}</span></p>
                  <p className={`mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{product.category}</p>
                  <p className={`mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{new Date(product.expirationDate).toLocaleDateString()}</p>
                  <p className={`mb-1 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Rating: <span className="font-medium">{product.rating} / 5</span></p>
                  <button
                    onClick={(e) => addToCartHandle(e, product)}
                    className="mt-auto bg-blue-500 hover:bg-blue-600 active:bg-blue-300 text-white px-4 py-2 rounded transition"
                  >
                    Add to cart
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
 