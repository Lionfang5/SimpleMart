import { useEffect, useContext, useState } from "react";
import { CartContext } from '../contexts/CartContext';
import { authFetch } from '../utils/authFetch';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Cart = () => {
  const { cartItems, fetchCartItems } = useContext(CartContext);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showToast, setShowToast] = useState(null);
  const [animatingItems, setAnimatingItems] = useState(new Set());
  const { isDark } = useTheme();

  // Mock coupons for demo - replace with your API
  const validCoupons = {
    'SAVE10': { discount: 0.1, minAmount: 100, description: '10% off orders over Rs.100' },
    'WELCOME20': { discount: 0.2, minAmount: 200, description: '20% off orders over Rs.200' },
    'FREESHIP': { freeShipping: true, minAmount: 50, description: 'Free shipping on orders over Rs.50' },
    'NEWUSER': { discount: 0.15, minAmount: 150, description: '15% off for new users over Rs.150' }
  };

  // Show toast notification
  const showNotification = (message, type = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  // Update item quantity
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const response = await authFetch(`http://localhost:5000/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      await fetchCartItems();
      showNotification('Quantity updated successfully!');
    } catch (err) {
      console.error('Failed to update quantity:', err);
      showNotification('Failed to update quantity', 'error');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Delete item with animation
  const itemDeleteHandle = async (itemId) => {
    setAnimatingItems(prev => new Set(prev).add(itemId));
    setRemovingItems(prev => new Set(prev).add(itemId));
    
    // Wait for animation
    setTimeout(async () => {
      try {
        const response = await authFetch(`http://localhost:5000/cart/${itemId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Delete failed');
        
        await fetchCartItems();
        showNotification('Item removed from cart');
      } catch (err) {
        console.error('Failed to remove item:', err);
        showNotification('Failed to remove item', 'error');
      } finally {
        setRemovingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        setShowConfirmDialog(null);
      }
    }, 300);
  };

  // Apply coupon code
  const applyCoupon = () => {
    setCouponError('');
    const coupon = validCoupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      setCouponError('Invalid coupon code. Try: SAVE10, WELCOME20, FREESHIP, NEWUSER');
      return;
    }
    
    if (total < coupon.minAmount) {
      setCouponError(`Minimum order amount is Rs.${coupon.minAmount}`);
      return;
    }
    
    setAppliedCoupon({ code: couponCode.toUpperCase(), ...coupon });
    setCouponCode('');
    showNotification(`Coupon ${couponCode.toUpperCase()} applied successfully!`);
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    showNotification('Coupon removed');
  };

  // Clear entire cart
  const clearCart = async () => {
    setLoading(true);
    try {
      const deletePromises = cartItems.map(item => 
        authFetch(`http://localhost:5000/cart/${item.productId}`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      await fetchCartItems();
      showNotification('Cart cleared successfully');
    } catch (err) {
      console.error('Failed to clear cart:', err);
      showNotification('Failed to clear cart', 'error');
    } finally {
      setLoading(false);
      setShowConfirmDialog(null);
    }
  };

  // Save for later (mock function)
  const saveForLater = (itemId) => {
    showNotification('Item saved for later!');
    // Implement your save for later logic here
  };

  useEffect(() => {
    fetchCartItems(); 
  }, [fetchCartItems]);

  useEffect(() => {
    if (cartItems) {
      const calculatedTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setTotal(calculatedTotal);
    }
  }, [cartItems]);

  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon || !appliedCoupon.discount) return 0;
    return total * appliedCoupon.discount;
  };

  // Calculate shipping
  const calculateShipping = () => {
    if (appliedCoupon && appliedCoupon.freeShipping) return 0;
    if (total > 500) return 0; // Free shipping over Rs.500
    return 100;
  };

  const tax = total * 0.08;
  const discount = calculateDiscount();
  const shipping = calculateShipping();
  const finalTotal = total - discount + shipping + tax;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className={`min-h-screen py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`max-w-2xl mx-auto rounded-lg shadow-xl p-8 text-center transform transition-all duration-500 hover:scale-105 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="text-8xl mb-6 animate-bounce">🛒</div>
          <h2 className={`text-3xl font-bold mb-4 ${
            isDark ? 'text-gray-200' : 'text-gray-800'
          }`}>Your cart is empty</h2>
          <p className={`mb-8 text-lg ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>Discover amazing products and fill your cart with joy!</p>
          <Link
            to="/"
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold"
          >
            <span className="mr-2">🛍️</span>
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 relative ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          showToast.type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {showToast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4">
        {/* Header with cart info and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className={`text-4xl font-bold ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Shopping Cart
            </h1>
            <p className={`text-lg ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmDialog('clear')}
              disabled={loading}
              className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="mr-2">🗑️</span>
              Clear Cart
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Left Side (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, id) => {
              const isRemoving = removingItems.has(item.productId);
              const isUpdating = updatingItems.has(item.productId);
              const isAnimating = animatingItems.has(item.productId);
              
              return (
                <div
                  key={item.productId || id}
                  className={`rounded-lg shadow-lg p-6 transform transition-all duration-300 ${
                    isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
                  } ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} hover:shadow-xl`}
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Product Image Placeholder */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {item.name.charAt(0)}
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div>
                          <h3 className={`text-xl font-semibold ${
                            isDark ? 'text-gray-200' : 'text-gray-800'
                          }`}>{item.name}</h3>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Category: {item.category}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Expires: {new Date(item.expirationDate).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="text-right mt-2 sm:mt-0">
                          <p className="text-2xl font-bold text-blue-600">
                            Rs.{item.price}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total: Rs.{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Quantity:
                          </span>
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating}
                              className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              -
                            </button>
                            <span className="px-4 py-2 border-x bg-gray-50 min-w-[3rem] text-center font-medium">
                              {isUpdating ? '...' : item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={isUpdating}
                              className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveForLater(item.productId)}
                            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Save for Later
                          </button>
                          <button
                            onClick={() => setShowConfirmDialog(item.productId)}
                            disabled={isRemoving}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                          >
                            {isRemoving ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary - Right Side (1/3 width) */}
          <div className="lg:col-span-1">
            <div className={`rounded-lg shadow-xl p-6 sticky top-8 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}>
              <h2 className={`text-2xl font-semibold mb-6 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>Order Summary</h2>
              
              {/* Coupon Section */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="font-medium mb-3">Have a coupon?</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                    className={`flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-gray-200' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Apply
                  </button>
                </div>
                
                {couponError && (
                  <p className="text-red-500 text-sm mb-2">{couponError}</p>
                )}
                
                {appliedCoupon && (
                  <div className="bg-green-100 border border-green-300 rounded p-3 flex justify-between items-center">
                    <div>
                      <span className="text-green-800 font-medium text-sm block">
                        {appliedCoupon.code} Applied!
                      </span>
                      <span className="text-green-700 text-xs">
                        {appliedCoupon.description}
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Try: SAVE10, WELCOME20, FREESHIP, NEWUSER
                </div>
              </div>
              
              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Subtotal ({cartItems.length} items):
                  </span>
                  <span className="font-medium">Rs.{total.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span className="font-medium">-Rs.{discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Shipping:
                    {shipping === 0 && (
                      <span className="text-green-600 ml-1 text-sm">(Free)</span>
                    )}
                  </span>
                  <span className="font-medium">Rs.{shipping.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax (8%):</span>
                  <span className="font-medium">Rs.{tax.toFixed(2)}</span>
                </div>
                
                {total < 500 && shipping > 0 && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Add Rs.{(500 - total).toFixed(2)} more for free shipping!
                  </div>
                )}
                
                <hr className={`my-4 ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
                
                <div className="flex justify-between text-xl font-bold">
                  <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>Total:</span>
                  <span className="text-blue-600">Rs.{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 text-center block transform hover:scale-105 hover:shadow-lg text-lg"
              >
                Proceed to Checkout →
              </Link>
              
              <div className="mt-4 text-center">
                <Link
                  to="/"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Continue Shopping
                </Link>
              </div>
              
              {/* Security Icons */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <span>🔒 Secure Checkout</span>
                  <span>📦 Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg p-6 max-w-md w-full transform transition-all duration-300 scale-100 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-xl font-semibold mb-4 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {showConfirmDialog === 'clear' ? '🗑️ Clear Cart?' : '❌ Remove Item?'}
              </h3>
              <p className={`mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {showConfirmDialog === 'clear' 
                  ? 'This will remove all items from your cart. This action cannot be undone.'
                  : 'Are you sure you want to remove this item from your cart?'
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(null)}
                  className={`flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                    isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showConfirmDialog === 'clear') {
                      clearCart();
                    } else {
                      itemDeleteHandle(showConfirmDialog);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                >
                  {showConfirmDialog === 'clear' ? 'Clear Cart' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;