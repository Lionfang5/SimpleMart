import { useState, useEffect } from "react";
import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import { authFetch } from "../utils/authFetch";
import { useTheme } from "../contexts/ThemeContext";

const AllProducts = () => {
  const [search, setSearch] = useState("");
  const [matched, setMatched] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { fetchCartItems } = useContext(CartContext);
  const { isDark } = useTheme();

  const addToCartHandle = (product) => {
    authFetch("http://localhost:5000/add_to_cart", {
      method: "POST",
      body: JSON.stringify(product),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network error while adding to cart");
        }
        return res.json();
      })
      .then(() => {
        fetchCartItems();
      })
      .catch((err) => {
        console.error("Add to cart error:", err);
      });
  };

  useEffect(() => {
    if (!search) {
      setMatched([]);
      setRelated([]);
      setError(null);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:5000/api/search?query=${encodeURIComponent(search)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        setMatched(data.matched || []);
        setRelated(data.related || []);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [search]);

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2
          className={`text-3xl font-bold text-center mb-8 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          All Products
        </h2>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <input
            className="w-full px-6 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            autoFocus
          />
        </div>

        {loading && (
          <p className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Loading...
          </p>
        )}

        {error && (
          <p className="text-center text-red-600 mb-4">
            Error: {error}
          </p>
        )}

        {search && (
          <>
            <h3
              className={`text-lg font-semibold mb-4 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Matched Products ({matched.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {matched.length === 0 && (
                <p className={`text-center col-span-full ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  No matched products found.
                </p>
              )}
              {matched.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  addToCartHandle={addToCartHandle}
                  isDark={isDark}
                />
              ))}
            </div>

            <h3
              className={`text-lg font-semibold mb-4 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Related Products ({related.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {related.length === 0 && (
                <p className={`text-center col-span-full ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  No related products.
                </p>
              )}
              {related.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  addToCartHandle={addToCartHandle}
                  isDark={isDark}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product, addToCartHandle, isDark }) => (
  <div
    className={`rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 ${
      isDark ? "bg-gray-800" : "bg-white"
    }`}
  >
    <img
      src={`http://localhost:5000/images/${product.image}`}
      alt={product.name}
      className="w-full h-48 object-cover mb-4 rounded-lg"
    />
    <div className="mb-4">
      <h3
        className={`text-lg font-semibold mb-2 ${
          isDark ? "text-gray-200" : "text-gray-800"
        }`}
      >
        {product.name}
      </h3>
      <p
        className={`text-sm mb-1 ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Category: {product.category}
      </p>
      <p
        className={`text-sm mb-3 ${
          isDark ? "text-gray-500" : "text-gray-500"
        }`}
      >
        Expires: {new Date(product.expirationDate).toLocaleDateString()}
      </p>
      <p className="text-2xl font-bold text-blue-600">${product.price}</p>
    </div>
    <button
      onClick={() => addToCartHandle(product)}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
    >
      Add to Cart
    </button>
  </div>
);

export default AllProducts;
