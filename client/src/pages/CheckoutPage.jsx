import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { authFetch } from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';

const CheckoutPage = () => {
  const { cartItems, fetchCartItems } = useContext(CartContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/Cart');
    }
  }, [cartItems, navigate]);

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (validateShippingData()) {
      setCurrentStep(2);
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (validatePaymentData()) {
      setCurrentStep(3);
    }
  };

  const validateShippingData = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingData[field].trim()) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Phone validation
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(shippingData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    setError('');
    return true;
  };

  const validatePaymentData = () => {
    if (!paymentData.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    
    if (!paymentData.cardName.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }
    
    if (!paymentData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError('Please enter expiry date in MM/YY format');
      return false;
    }
    
    if (!paymentData.cvv.match(/^\d{3,4}$/)) {
      setError('Please enter a valid CVV');
      return false;
    }
    
    setError('');
    return true;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');
    
    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          expirationDate: item.expirationDate
        })),
        totalAmount: total,
        shippingAddress: shippingData,
        paymentInfo: paymentData
      };

      const response = await authFetch('http://localhost:5000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const result = await response.json();
      
      // Clear cart and redirect to success page
      await fetchCartItems();
      navigate('/order-success', { 
        state: { 
          orderId: result.order._id,
          orderData: result.order 
        } 
      });
      
    } catch (err) {
      console.error('Order placement error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const steps = [
    { number: 1, title: 'Shipping', icon: '🚚' },
    { number: 2, title: 'Payment', icon: '💳' },
    { number: 3, title: 'Review', icon: '📋' }
  ];

  if (!cartItems || cartItems.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={`min-h-screen py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-3xl font-bold text-center mb-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Checkout
        </h1>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : isDark
                      ? 'border-gray-600 text-gray-400'
                      : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <span className={`ml-2 font-medium ${
                  currentStep >= step.number
                    ? isDark ? 'text-blue-400' : 'text-blue-600'
                    : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.number
                      ? 'bg-blue-500'
                      : isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  🚚 Shipping Information
                </h2>
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.firstName}
                        onChange={(e) => setShippingData(prev => ({ ...prev, firstName: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.lastName}
                        onChange={(e) => setShippingData(prev => ({ ...prev, lastName: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={shippingData.email}
                        onChange={(e) => setShippingData(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={shippingData.phone}
                        onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingData.address}
                      onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                      className={`w-full p-3 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.city}
                        onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.state}
                        onChange={(e) => setShippingData(prev => ({ ...prev, state: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.zipCode}
                        onChange={(e) => setShippingData(prev => ({ ...prev, zipCode: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Payment Information */}
            {currentStep === 2 && (
              <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  💳 Payment Information
                </h2>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Card Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      maxLength={19}
                      className={`w-full p-3 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardName: e.target.value }))}
                      className={`w-full p-3 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={paymentData.expiryDate}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                        maxLength={5}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        CVV *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        maxLength={4}
                        className={`w-full p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className={`flex-1 py-3 px-6 rounded-lg font-medium border transition-colors ${
                        isDark 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Back to Shipping
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                    >
                      Review Order
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && (
              <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  📋 Review Your Order
                </h2>

                {/* Shipping Information Review */}
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Shipping Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {shippingData.firstName} {shippingData.lastName}
                    </p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {shippingData.address}
                    </p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {shippingData.city}, {shippingData.state} {shippingData.zipCode}
                    </p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {shippingData.email} • {shippingData.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>

                {/* Payment Information Review */}
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Payment Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      Card ending in {paymentData.cardNumber.slice(-4)}
                    </p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {paymentData.cardName}
                    </p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      Expires {paymentData.expiryDate}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>

                {/* Order Items Review */}
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {item.name}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={loading}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium border transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Back to Payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-lg shadow sticky top-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Order Summary
              </h3>
              
              <div className="space-y-3 mb-4">
                {cartItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    +{cartItems.length - 3} more items
                  </p>
                )}
              </div>

              <div className={`space-y-2 pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Shipping:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    ${shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div className={`flex justify-between text-lg font-bold pt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>Total:</span>
                  <span className="text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;