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
  
  // Nepal states/provinces
  const nepalStates = [
    'Province No. 1',
    'Madhesh Province',
    'Bagmati Province',
    'Gandaki Province',
    'Lumbini Province',
    'Karnali Province',
    'Sudurpashchim Province'
  ];

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

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'cod'

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 100;
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

  // Real-time validation functions
  const validateField = (fieldName, value, isPayment = false) => {
    const errors = { ...validationErrors };
    
    if (isPayment) {
      switch (fieldName) {
        case 'cardNumber':
          if (!value.replace(/\s/g, '').match(/^\d{16}$/)) {
            errors.cardNumber = 'Card number must be 16 digits';
          } else {
            delete errors.cardNumber;
          }
          break;
        case 'cardName':
          if (!value.trim() || value.trim().length < 2) {
            errors.cardName = 'Cardholder name is required (minimum 2 characters)';
          } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            errors.cardName = 'Cardholder name can only contain letters and spaces';
          } else {
            delete errors.cardName;
          }
          break;
        case 'expiryDate':
          if (!value.match(/^\d{2}\/\d{2}$/)) {
            errors.expiryDate = 'Expiry date must be in MM/YY format';
          } else {
            const [month, year] = value.split('/');
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear() % 100;
            const currentMonth = currentDate.getMonth() + 1;
            
            if (parseInt(month) < 1 || parseInt(month) > 12) {
              errors.expiryDate = 'Invalid month (01-12)';
            } else if (parseInt(year) < currentYear || 
                      (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
              errors.expiryDate = 'Card has expired';
            } else {
              delete errors.expiryDate;
            }
          }
          break;
        case 'cvv':
          if (!value.match(/^\d{3,4}$/)) {
            errors.cvv = 'CVV must be 3 or 4 digits';
          } else {
            delete errors.cvv;
          }
          break;
      }
    } else {
      switch (fieldName) {
        case 'firstName':
        case 'lastName':
          if (!value.trim()) {
            errors[fieldName] = `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
          } else if (value.trim().length < 2) {
            errors[fieldName] = `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
          } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            errors[fieldName] = 'Name can only contain letters and spaces';
          } else {
            delete errors[fieldName];
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!value.trim()) {
            errors.email = 'Email is required';
          } else if (!emailRegex.test(value)) {
            errors.email = 'Please enter a valid email address';
          } else {
            delete errors.email;
          }
          break;
        case 'phone':
          const cleanPhone = value.replace(/\D/g, '');
          if (!cleanPhone) {
            errors.phone = 'Phone number is required';
          } else if (cleanPhone.length < 10) {
            errors.phone = 'Phone number must be at least 10 digits';
          } else if (cleanPhone.length > 15) {
            errors.phone = 'Phone number cannot exceed 15 digits';
          } else {
            delete errors.phone;
          }
          break;
        case 'address':
          if (!value.trim()) {
            errors.address = 'Address is required';
          } else if (value.trim().length < 5) {
            errors.address = 'Address must be at least 5 characters';
          } else {
            delete errors.address;
          }
          break;
        case 'city':
          if (!value.trim()) {
            errors.city = 'City is required';
          } else if (value.trim().length < 2) {
            errors.city = 'City name must be at least 2 characters';
          } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            errors.city = 'City name can only contain letters and spaces';
          } else {
            delete errors.city;
          }
          break;
        case 'state':
          if (!value.trim()) {
            errors.state = 'State/Province is required';
          } else {
            delete errors.state;
          }
          break;
        case 'zipCode':
          if (!value.trim()) {
            errors.zipCode = 'ZIP code is required';
          } else if (!/^\d{5,6}$/.test(value)) {
            errors.zipCode = 'ZIP code must be 5 or 6 digits';
          } else {
            delete errors.zipCode;
          }
          break;
      }
    }
    
    setValidationErrors(errors);
  };

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
    const errors = {};
    
    // Validate all fields
    Object.keys(shippingData).forEach(field => {
      validateField(field, shippingData[field], false);
    });
    
    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix all validation errors before proceeding');
      return false;
    }
    
    setError('');
    return true;
  };

  const validatePaymentData = () => {
    // Skip validation for Cash on Delivery
    if (paymentMethod === 'cod') {
      setError('');
      return true;
    }

    // Validate all payment fields for card payment
    Object.keys(paymentData).forEach(field => {
      validateField(field, paymentData[field], true);
    });
    
    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix all validation errors before proceeding');
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
        paymentInfo: paymentMethod === 'cod' ? { method: 'cod' } : paymentData
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
    // Allow complete deletion
    if (value === '') return '';
    
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    // Allow deletion by checking if we're reducing the length
    if (v.length === 0) return '';
    if (v.length === 1) return v;
    if (v.length === 2) return v;
    if (v.length >= 3) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    
    return v;
  };

  const formatPhoneNumber = (value) => {
    // Allow only numbers and some common phone formatting characters
    return value.replace(/[^\d\s\-\+\(\)]/g, '');
  };

  const formatZipCode = (value) => {
    // Allow only numbers for ZIP code
    return value.replace(/[^\d]/g, '');
  };

  const formatNameField = (value) => {
    // Allow only letters and spaces for name fields
    return value.replace(/[^a-zA-Z\s]/g, '');
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
                        onChange={(e) => {
                          const value = formatNameField(e.target.value);
                          setShippingData(prev => ({ ...prev, firstName: value }));
                          validateField('firstName', value);
                        }}
                        className={`w-full p-3 rounded-lg border ${
                          validationErrors.firstName ? 'border-red-500' : 
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.lastName}
                        onChange={(e) => {
                          const value = formatNameField(e.target.value);
                          setShippingData(prev => ({ ...prev, lastName: value }));
                          validateField('lastName', value);
                        }}
                        className={`w-full p-3 rounded-lg border ${
                          validationErrors.lastName ? 'border-red-500' : 
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                      {validationErrors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                      )}
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
                        onChange={(e) => {
                          setShippingData(prev => ({ ...prev, email: e.target.value }));
                          validateField('email', e.target.value);
                        }}
                        className={`w-full p-3 rounded-lg border ${
                          validationErrors.email ? 'border-red-500' : 
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={shippingData.phone}
                        onChange={(e) => {
                          const value = formatPhoneNumber(e.target.value);
                          setShippingData(prev => ({ ...prev, phone: value }));
                          validateField('phone', value);
                        }}
                        placeholder="+977-1-1234567 or 9841234567"
                        className={`w-full p-3 rounded-lg border ${
                          validationErrors.phone ? 'border-red-500' : 
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                      )}
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
                      onChange={(e) => {
                        setShippingData(prev => ({ ...prev, address: e.target.value }));
                        validateField('address', e.target.value);
                      }}
                      placeholder="Street address, apartment, suite, etc."
                      className={`w-full p-3 rounded-lg border ${
                        validationErrors.address ? 'border-red-500' : 
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                    {validationErrors.address && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                    )}
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
                        onChange={(e) => {
                          const value = formatNameField(e.target.value);
                          setShippingData(prev => ({ ...prev, city: value }));
                          validateField('city', value);
                        }}
                        placeholder="Kathmandu"
                        className={`w-full p-3 rounded-lg border ${
                          validationErrors.city ? 'border-red-500' : 
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        State/Province *
                      </label>
                      <select
                        required
                        value={shippingData.state}
                        onChange={(e) => {
                          setShippingData(prev => ({ ...prev, state: e.target.value }));
                          validateField('state', e.target.value);
                        }}
                        className={`w-full p-3 rounded-lg border ${
                          validationErrors.state ? 'border-red-500' : 
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      >
                        <option value="">Select Province</option>
                        {nepalStates.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {validationErrors.state && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.zipCode}
                        onChange={(e) => {
                          const value = formatZipCode(e.target.value);
                          setShippingData(prev => ({ ...prev, zipCode: value }));
                          validateField('zipCode', value);
                        }}
                        placeholder="44600"
                        maxLength={6}
                        className={`w-full p-3 rounded-lg border ${
                          validationErrors.zipCode ? 'border-red-500' : 
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                      {validationErrors.zipCode && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.zipCode}</p>
                      )}
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
                
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select Payment Method *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => {
                        setPaymentMethod('card');
                        // Clear any payment validation errors when switching methods
                        const newErrors = { ...validationErrors };
                        ['cardNumber', 'cardName', 'expiryDate', 'cvv'].forEach(field => {
                          delete newErrors[field];
                        });
                        setValidationErrors(newErrors);
                        setError('');
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isDark
                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          paymentMethod === 'card' 
                            ? 'border-blue-500 bg-blue-500' 
                            : isDark ? 'border-gray-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'card' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            💳 Credit/Debit Card
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Pay with your card securely
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        setPaymentMethod('cod');
                        // Clear all payment validation errors when switching to COD
                        const newErrors = { ...validationErrors };
                        ['cardNumber', 'cardName', 'expiryDate', 'cvv'].forEach(field => {
                          delete newErrors[field];
                        });
                        setValidationErrors(newErrors);
                        setError('');
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : isDark
                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          paymentMethod === 'cod' 
                            ? 'border-green-500 bg-green-500' 
                            : isDark ? 'border-gray-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'cod' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            🚚 Cash on Delivery
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Pay when you receive your order
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {/* Card Payment Fields - Only show when card is selected */}
                  {paymentMethod === 'card' && (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Card Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="1234 5678 9012 3456"
                          value={paymentData.cardNumber}
                          onChange={(e) => {
                            const value = formatCardNumber(e.target.value);
                            setPaymentData(prev => ({ ...prev, cardNumber: value }));
                            validateField('cardNumber', value, true);
                          }}
                          maxLength={19}
                          className={`w-full p-3 rounded-lg border ${
                            validationErrors.cardNumber ? 'border-red-500' : 
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-gray-200' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                        {validationErrors.cardNumber && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.cardNumber}</p>
                        )}
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
                          onChange={(e) => {
                            const value = formatNameField(e.target.value);
                            setPaymentData(prev => ({ ...prev, cardName: value }));
                            validateField('cardName', value, true);
                          }}
                          className={`w-full p-3 rounded-lg border ${
                            validationErrors.cardName ? 'border-red-500' : 
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-gray-200' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                        {validationErrors.cardName && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.cardName}</p>
                        )}
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
                            onChange={(e) => {
                              const value = formatExpiryDate(e.target.value);
                              setPaymentData(prev => ({ ...prev, expiryDate: value }));
                              validateField('expiryDate', value, true);
                            }}
                            onKeyDown={(e) => {
                              // Allow backspace to delete the slash and previous characters
                              if (e.key === 'Backspace' && paymentData.expiryDate.includes('/')) {
                                const currentValue = e.target.value;
                                if (currentValue.endsWith('/')) {
                                  e.preventDefault();
                                  const newValue = currentValue.slice(0, -1);
                                  setPaymentData(prev => ({ ...prev, expiryDate: newValue }));
                                  validateField('expiryDate', newValue, true);
                                }
                              }
                            }}
                            maxLength={5}
                            className={`w-full p-3 rounded-lg border ${
                              validationErrors.expiryDate ? 'border-red-500' : 
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                : 'bg-white border-gray-300 text-gray-800'
                            }`}
                          />
                          {validationErrors.expiryDate && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.expiryDate}</p>
                          )}
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
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setPaymentData(prev => ({ ...prev, cvv: value }));
                              validateField('cvv', value, true);
                            }}
                            maxLength={4}
                            className={`w-full p-3 rounded-lg border ${
                              validationErrors.cvv ? 'border-red-500' : 
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                : 'bg-white border-gray-300 text-gray-800'
                            }`}
                          />
                          {validationErrors.cvv && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.cvv}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Cash on Delivery Information */}
                  {paymentMethod === 'cod' && (
                    <div className={`p-4 rounded-lg border ${isDark ? 'border-green-700 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">🚚</div>
                        <div>
                          <h3 className={`font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                            Cash on Delivery Selected
                          </h3>
                          <p className={`text-sm mt-1 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                            You will pay in cash when your order is delivered to your address.
                          </p>
                          <ul className={`text-sm mt-2 space-y-1 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                            <li>• Please keep the exact amount ready</li>
                            <li>• Our delivery partner will collect the payment</li>
                            <li>• You can inspect your order before payment</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        // Clear all validation errors when going back
                        setValidationErrors({});
                        setError('');
                        setCurrentStep(1);
                      }}
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
                    {paymentMethod === 'card' ? (
                      <>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          💳 Card ending in {paymentData.cardNumber.slice(-4)}
                        </p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {paymentData.cardName}
                        </p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          Expires {paymentData.expiryDate}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          🚚 Cash on Delivery
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Payment will be collected upon delivery
                        </p>
                      </>
                    )}
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
                          Rs.{(item.price * item.quantity).toFixed(2)}
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
                      Rs.{(item.price * item.quantity).toFixed(2)}
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
                    Rs.{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Shipping:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Rs.{shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Rs.{tax.toFixed(2)}
                  </span>
                </div>
                <div className={`flex justify-between text-lg font-bold pt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>Total:</span>
                  <span className="text-green-600">Rs.{total.toFixed(2)}</span>
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