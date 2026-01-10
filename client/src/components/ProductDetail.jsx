import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { CartContext } from '../contexts/CartContext';
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';
import { authFetch } from '../utils/authFetch';

const ProductDetail = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { fetchCartItems } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Logged-in user
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch product details
    fetch(`http://localhost:5000/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch product details');
        return res.json();
      })
      .then(data => setProduct(data))
      .catch(err => setError(err));

    // Fetch comments for this product
    fetch(`http://localhost:5000/comments/${id}`)
      .then(res => res.json())
      .then(data => setComments(data))
      .catch(err => console.error("Comment fetch error:", err));

    // Fetch logged-in user info and wishlist status
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Get user data
      fetch("http://localhost:5000/user-data", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("User not logged in");
          return res.json();
        })
        .then(data => setUser(data))
        .catch(() => setUser(null));

      // Check if product is in wishlist
      authFetch("http://localhost:5000/wishlist")
        .then(res => {
          if (res.ok) return res.json();
          return [];
        })
        .then(wishlistItems => {
          setIsInWishlist(wishlistItems.some(item => item._id === id));
        })
        .catch(err => console.error("Failed to fetch wishlist:", err));
    }
  }, [id]);

  // Add to cart handler
  const handleAddToCart = async () => {
    try {
      const res = await authFetch("http://localhost:5000/add_to_cart", {
        method: "POST",
        body: JSON.stringify(product)
      });

      if (!res.ok) throw new Error("Failed to add to cart");

      fetchCartItems(); 
      alert("✅ Product added to cart!");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("❌ Failed to add to cart");
    }
  };

  // Wishlist handlers
  const handleAddToWishlist = async () => {
    try {
      const res = await authFetch("http://localhost:5000/add_to_wishlist", {
        method: "POST",
        body: JSON.stringify({ productId: product._id })
      });

      if (!res.ok) throw new Error("Failed to add to wishlist");
      
      setIsInWishlist(true);
    } catch (err) {
      console.error("Add to wishlist error:", err);
      alert("❌ Failed to add to wishlist");
    }
  };

  const handleRemoveFromWishlist = async () => {
    try {
      const res = await authFetch(`http://localhost:5000/remove_from_wishlist/${product._id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to remove from wishlist");
      
      setIsInWishlist(false);
    } catch (err) {
      console.error("Remove from wishlist error:", err);
      alert("❌ Failed to remove from wishlist");
    }
  };

  // Submit comment handler
  const handleCommentSubmit = async () => {
    if (!user) {
      alert("⚠️ Please log in first to comment.");
      return;
    }
    if (!newComment.trim()) return;

    try {
      const response = await fetch("http://localhost:5000/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          user: user.username,
          text: newComment
        })
      });

      if (!response.ok) throw new Error("Failed to post comment");

      const savedComment = await response.json();
      setComments(prev => [...prev, savedComment]); 
      setNewComment(""); 
    } catch (err) {
      console.error("Comment submit error:", err);
    }
  };

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-red-500' : 'bg-gray-100 text-red-600'}`}>
        {error.message}
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-10 px-4 md:px-8 ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Product Details Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {/* Product Image */}
          <div className="w-full md:w-1/2">
            <img
              src={`http://localhost:5000/images/${product.image}`}
              alt={product.name}
              className="rounded-xl shadow-lg object-cover w-full max-h-[500px]"
            />
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-lg mb-2"><span className="font-semibold">Price:</span> Rs.{product.price}</p>
            <p className="text-lg mb-2"><span className="font-semibold">Category:</span> {product.category}</p>
            <p className="text-lg mb-2"><span className="font-semibold">Expiration Date:</span> {new Date(product.expirationDate).toLocaleDateString()}</p>
            <p className="text-lg mb-2"><span className="font-semibold">Rating:</span> {product.rating} / 5</p>
            <p className="text-lg mt-4"><span className="font-semibold">Description:</span><br />{product.description || 'No description available.'}</p>

            {/* ✅ Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
              🛒 Add to Cart
            </button>

            {/* AI Badge */}
            <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-purple-900 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-center">
                <div className="text-lg mr-2">🤖</div>
                <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  AI-powered recommendations available below based on customer purchase patterns
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Powered Frequently Bought Together Section */}
        <FrequentlyBoughtTogether 
          productId={id} 
          currentProduct={product}
        />

        {/* ✅ Comment Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">💬 Comments</h2>

          {comments.length === 0 && (
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No comments yet. Be the first!
            </p>
          )}

          <ul className="space-y-3 mb-6">
            {comments.map((comment, index) => (
              <li 
                key={index} 
                className={`border p-4 rounded-md ${
                  isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <strong className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {comment.user}
                  </strong>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {comment.text}
                </p>
              </li>
            ))}
          </ul>

          {/* ✅ Comment Input */}
          <div className={`border rounded-lg p-4 ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
            <textarea
              className={`w-full p-3 border rounded-md resize-none ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              } ${!user ? 'opacity-50' : ''}`}
              rows="3"
              placeholder={user ? "Write a comment..." : "Log in to write a comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user}
            />

            <div className="flex justify-between items-center mt-3">
              {!user && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please log in to leave a comment
                </p>
              )}
              <div className="ml-auto">
                <button
                  onClick={handleCommentSubmit}
                  disabled={!user || !newComment.trim()}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    user && newComment.trim()
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  ➕ Submit Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;