import { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';

const OrderManagement = ({ orders: initialOrders, setOrders: setParentOrders }) => {
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(!initialOrders);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
      setLoading(false);
    } else {
      fetchOrders();
    }
  }, [initialOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch('http://localhost:5000/orders');
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch orders: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('Fetched orders:', data);
      
      setOrders(Array.isArray(data) ? data : []);
      
      if (setParentOrders) {
        setParentOrders(Array.isArray(data) ? data : []);
      }
      
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await authFetch(`http://localhost:5000/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update order status: ${response.status} - ${errorData}`);
      }

      const updatedOrders = orders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus }
          : order
      );
      
      setOrders(updatedOrders);
      
      if (setParentOrders) {
        setParentOrders(updatedOrders);
      }

      alert('Order status updated successfully!');
    } catch (err) {
      console.error('Update order error:', err);
      alert(`Failed to update order: ${err.message}`);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      const response = await authFetch(`http://localhost:5000/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to delete order: ${response.status} - ${errorData}`);
      }

      const updatedOrders = orders.filter(order => order._id !== orderId);
      setOrders(updatedOrders);
      
      if (setParentOrders) {
        setParentOrders(updatedOrders);
      }

      alert('Order deleted successfully!');
    } catch (err) {
      console.error('Delete order error:', err);
      alert(`Failed to delete order: ${err.message}`);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Order Management ({orders.length} orders)
          </h2>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Orders
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Orders Found
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Orders will appear here when customers place them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <th className={`text-left p-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Order ID
                  </th>
                  <th className={`text-left p-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Customer Details
                  </th>
                  <th className={`text-left p-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Items
                  </th>
                  <th className={`text-left p-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Total
                  </th>
                  <th className={`text-left p-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Status
                  </th>
                  <th className={`text-left p-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Date
                  </th>
                  <th className={`text-left p-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id || index} className={`border-b ${
                    isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <td className="p-4">
                      <span className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        #{order._id ? order._id.slice(-8).toUpperCase() : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {order.shippingAddress?.firstName || 'N/A'} {order.shippingAddress?.lastName || ''}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          📧 {order.shippingAddress?.email || 'N/A'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          📱 {order.shippingAddress?.phone || 'N/A'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          📍 {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </p>
                        {order.items && order.items.length > 0 && (
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="text-xs text-blue-600 hover:text-blue-700 underline"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold text-lg ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        ${(order.totalAmount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className={`text-xs px-2 py-1 border rounded ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-gray-200' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded transition-colors"
                          title="Delete Order"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Summary Stats */}
        {orders.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => {
              const count = orders.filter(order => order.status?.toLowerCase() === status).length;
              return (
                <div key={status} className={`p-4 rounded-lg ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-2xl w-full rounded-lg shadow-xl max-h-[80vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Order Details #{selectedOrder._id.slice(-8).toUpperCase()}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className={`text-gray-500 hover:text-gray-700 text-2xl ${isDark ? 'hover:text-gray-300' : ''}`}
                >
                  ×
                </button>
              </div>

              {/* Customer Information */}
              <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Customer & Shipping Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Name: {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Email: {selectedOrder.shippingAddress.email}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Phone: {selectedOrder.shippingAddress.phone}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Address:
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedOrder.shippingAddress.address}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Order Items ({selectedOrder.items.length})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Qty: {item.quantity} × ${item.price}
                        </p>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className={`mt-4 pt-4 border-t flex justify-between items-center ${
                  isDark ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <p className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Total: ${selectedOrder.totalAmount.toFixed(2)}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Payment Information (if available) */}
              {selectedOrder.paymentInfo && (
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Payment Information
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Card ending in: ****{selectedOrder.paymentInfo.cardNumber?.slice(-4) || 'N/A'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cardholder: {selectedOrder.paymentInfo.cardName || 'N/A'}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderManagement;