// client/src/pages/OrderSuccess.jsx - ENHANCED VERSION

import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { authFetch } from '../utils/authFetch';

const OrderSuccessPage = () => {
  const { state } = useLocation();
  const { isDark } = useTheme();
  const [orderData, setOrderData] = useState(state?.orderData);
  const [currentStatus, setCurrentStatus] = useState(state?.orderData?.status || 'pending');
  const orderId = state?.orderId;

  // Real-time order status updates
  useEffect(() => {
    if (!orderId) return;

    const checkOrderStatus = async () => {
      try {
        const response = await authFetch(`http://localhost:5000/orders/${orderId}`);
        if (response.ok) {
          const updatedOrder = await response.json();
          setOrderData(updatedOrder);
          setCurrentStatus(updatedOrder.status);
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
      }
    };

    // Check status immediately
    checkOrderStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkOrderStatus, 30000);

    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!orderData || !orderId) {
    return (
      <div className={`min-h-screen py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Order Not Found
          </h1>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We couldn't find your order information.
          </p>
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: {
        icon: '⏳',
        color: 'yellow',
        message: 'Order is being prepared',
        bgColor: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
        textColor: isDark ? 'text-yellow-300' : 'text-yellow-800',
        borderColor: isDark ? 'border-yellow-700' : 'border-yellow-200'
      },
      processing: {
        icon: '📦',
        color: 'blue',
        message: 'Order is being processed',
        bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
        textColor: isDark ? 'text-blue-300' : 'text-blue-800',
        borderColor: isDark ? 'border-blue-700' : 'border-blue-200'
      },
      shipped: {
        icon: '🚚',
        color: 'purple',
        message: 'Order has been shipped',
        bgColor: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
        textColor: isDark ? 'text-purple-300' : 'text-purple-800',
        borderColor: isDark ? 'border-purple-700' : 'border-purple-200'
      },
      delivered: {
        icon: '✅',
        color: 'green',
        message: 'Order has been delivered!',
        bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
        textColor: isDark ? 'text-green-300' : 'text-green-800',
        borderColor: isDark ? 'border-green-700' : 'border-green-200'
      },
      cancelled: {
        icon: '❌',
        color: 'red',
        message: 'Order has been cancelled',
        bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
        textColor: isDark ? 'text-red-300' : 'text-red-800',
        borderColor: isDark ? 'border-red-700' : 'border-red-200'
      }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const statusInfo = getStatusInfo(currentStatus);

  const orderSteps = [
    { 
      step: 'pending', 
      title: 'Order Placed', 
      description: 'Payment processed successfully',
      completed: ['pending', 'processing', 'shipped', 'delivered'].includes(currentStatus)
    },
    { 
      step: 'processing', 
      title: 'Processing', 
      description: 'Preparing your items',
      completed: ['processing', 'shipped', 'delivered'].includes(currentStatus)
    },
    { 
      step: 'shipped', 
      title: 'Shipped', 
      description: 'On the way to you',
      completed: ['shipped', 'delivered'].includes(currentStatus)
    },
    { 
      step: 'delivered', 
      title: 'Delivered', 
      description: 'Enjoy your order!',
      completed: currentStatus === 'delivered'
    }
  ];

  return (
    <div className={`min-h-screen py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Order Placed Successfully! 🎉
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Thank you for your order. We'll send you updates via email.
          </p>
        </div>

        {/* Real-time Status Banner */}
        <div className={`mb-8 p-6 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
          <div className="flex items-center justify-center space-x-4">
            <div className="text-3xl">{statusInfo.icon}</div>
            <div className="text-center">
              <h2 className={`text-xl font-bold ${statusInfo.textColor}`}>
                Current Status: {currentStatus.toUpperCase()}
              </h2>
              <p className={`${statusInfo.textColor}`}>
                {statusInfo.message}
              </p>
              {currentStatus === 'delivered' && (
                <p className={`text-sm mt-2 ${statusInfo.textColor}`}>
                  🤖 Your order data is now contributing to our AI recommendation system!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Progress Timeline */}
        <div className={`mb-8 p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Order Progress
          </h3>
          <div className="relative">
            {orderSteps.map((step, index) => (
              <div key={step.step} className="flex items-center mb-6 last:mb-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStatus === step.step
                      ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                      : isDark
                        ? 'border-gray-600 text-gray-400'
                        : 'border-gray-300 text-gray-500'
                }`}>
                  {step.completed ? '✓' : index + 1}
                </div>
                <div className="ml-4">
                  <h4 className={`font-medium ${
                    step.completed || currentStatus === step.step
                      ? isDark ? 'text-white' : 'text-gray-800'
                      : isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm ${
                    step.completed || currentStatus === step.step
                      ? isDark ? 'text-gray-300' : 'text-gray-600'
                      : isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {index < orderSteps.length - 1 && (
                  <div className={`absolute left-4 w-0.5 h-6 mt-8 ${
                    step.completed ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`} style={{ top: `${index * 100 + 32}px` }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Information */}
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Order Information
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Order Number:</span>
                <span className={`font-mono font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  #{orderId.slice(-8).toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Order Date:</span>
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {new Date(orderData.orderDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                  {currentStatus}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Amount:</span>
                <span className={`font-bold text-lg text-green-600`}>
                  Rs.{orderData.totalAmount.toFixed(2)}
                </span>
              </div>

              {orderData.paymentInfo?.transactionId && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Transaction ID:</span>
                  <span className={`font-mono text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {orderData.paymentInfo.transactionId}
                  </span>
                </div>
              )}
            </div>

            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                What happens next?
              </h3>
              <div className="space-y-2 text-sm">
                <div className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Order confirmation email sent
                </div>
                <div className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`w-2 h-2 rounded-full mr-3 ${
                    ['processing', 'shipped', 'delivered'].includes(currentStatus) 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                  }`}></span>
                  Order processing (1 minute in demo)
                </div>
                <div className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`w-2 h-2 rounded-full mr-3 ${
                    ['shipped', 'delivered'].includes(currentStatus) 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                  }`}></span>
                  Shipping notification (3 minutes in demo)
                </div>
                <div className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`w-2 h-2 rounded-full mr-3 ${
                    currentStatus === 'delivered' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></span>
                  Delivery (5 minutes in demo)
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Order Items */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Shipping Address
              </h3>
              <div className={`space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className="font-medium">
                  {orderData.shippingAddress?.firstName} {orderData.shippingAddress?.lastName}
                </p>
                <p>{orderData.shippingAddress?.address}</p>
                <p>
                  {orderData.shippingAddress?.city}, {orderData.shippingAddress?.state} {orderData.shippingAddress?.zipCode}
                </p>
                <p>{orderData.shippingAddress?.email}</p>
                <p>{orderData.shippingAddress?.phone}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Order Items
              </h3>
              <div className="space-y-4">
                {orderData.items?.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center py-3 border-b last:border-b-0 ${
                    isDark ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.name}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Quantity: {item.quantity}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${item.price} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>Total:</span>
                  <span className="text-green-600">Rs.{orderData.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <Link
              to="/my-orders"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              View All Orders
            </Link>
            <Link
              to="/"
              className={`px-6 py-3 rounded-lg font-medium border transition-colors ${
                isDark 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Continue Shopping
            </Link>
          </div>
          
          {/* Demo Information */}
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              🚀 Demo Mode: Orders automatically progress through statuses for testing. 
              In production, these would be updated by fulfillment systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;