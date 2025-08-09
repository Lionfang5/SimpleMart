import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { CartContext } from '../contexts/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { fetchCartItems } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  // 🆕 Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 🆕 Logged-in user
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ✅ Fetch product details
    fetch(`http://localhost:5000/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch product details');
        return res.json();
      })
      .then(data => setProduct(data))
      .catch(err => setError(err));

    // ✅ Fetch comments for this product
    fetch(`http://localhost:5000/comments/${id}`)
      .then(res => res.json())
      .then(data => setComments(data))
      .catch(err => console.error("Comment fetch error:", err));

    // ✅ Fetch logged-in user info if token exists
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetch("http://localhost:5000/user-data", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("User not logged in");
          return res.json();
        })
        .then(data => setUser(data))
        .catch(() => setUser(null)); // if token invalid → logged out
    }
  }, [id]);

  // ✅ Add to cart handler
  const handleAddToCart = async () => {
    try {
      const res = await fetch("http://localhost:5000/add_to_cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
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

  // ✅ Submit comment handler
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
          user: user.username,  // ✅ use actual username
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
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
        
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
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700"
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>

      {/* ✅ Comment Section */}
      <div className="max-w-5xl mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-4">💬 Comments</h2>

        {comments.length === 0 && <p>No comments yet. Be the first!</p>}

        <ul className="space-y-2 mb-4">
          {comments.map((comment, index) => (
            <li key={index} className="border p-2 rounded-md bg-gray-100">
              <strong>{comment.user}:</strong> {comment.text}
            </li>
          ))}
        </ul>

        {/* ✅ Only allow logged-in users to type comments */}
        <textarea
          className="w-full p-2 border rounded-md"
          rows="3"
          placeholder={user ? "Write a comment..." : "Log in to write a comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user}
        />

        <button
          onClick={handleCommentSubmit}
          className={`mt-2 px-4 py-2 text-white rounded-lg ${user ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          ➕ Submit Comment
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
