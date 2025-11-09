import { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { isDark } = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data and orders in parallel
      const [userResponse, ordersResponse] = await Promise.all([
        authFetch('http://localhost:5000/user-data'),
        authFetch('http://localhost:5000/orders/my-orders')
      ]);

      if (!userResponse.ok) throw new Error('Failed to fetch user data');
      if (!ordersResponse.ok) throw new Error('Failed to fetch orders');

      const user = await userResponse.json();
      const userOrders = await ordersResponse.json();

      setUserData(user);
      setOrders(userOrders);

      // Calculate stats
      const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const pendingOrders = userOrders.filter(order => 
        ['pending', 'processing'].includes(order.status)
      ).length;
      const completedOrders = userOrders.filter(order => 
        order.status === 'delivered'
      ).length;

      setStats({
        totalOrders: userOrders.length,
        totalSpent,
        pendingOrders,
        completedOrders
      });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Welcome back, {userData?.username || 'User'}! 👋
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Here's what's happening with your orders and account
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Orders
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {stats.totalOrders}
                </p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Spent
                </p>
                <p className={`text-2xl font-bold text-green-600`}>
                  Rs.{stats.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending Orders
                </p>
                <p className={`text-2xl font-bold text-yellow-600`}>
                  {stats.pendingOrders}
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completed Orders
                </p>
                <p className={`text-2xl font-bold text-green-600`}>
                  {stats.completedOrders}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b mb-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'orders', label: 'Recent Orders', icon: '📦' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-6 font-semibold transition-colors ${
                activeTab === tab.id 
                  ? `border-b-2 border-blue-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}` 
                  : `${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  to="/"
                  className={`p-4 rounded-lg border-2 border-dashed transition-colors hover:border-solid text-center ${
                    isDark 
                      ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700' 
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-2xl mb-2">🛒</div>
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Continue Shopping
                  </p>
                </Link>

                <Link
                  to="/Cart"
                  className={`p-4 rounded-lg border-2 border-dashed transition-colors hover:border-solid text-center ${
                    isDark 
                      ? 'border-gray-600 hover:border-green-500 hover:bg-gray-700' 
                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="text-2xl mb-2">🛍️</div>
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    View Cart
                  </p>
                </Link>

                <Link
                  to="/Settings"
                  className={`p-4 rounded-lg border-2 border-dashed transition-colors hover:border-solid text-center ${
                    isDark 
                      ? 'border-gray-600 hover:border-purple-500 hover:bg-gray-700' 
                      : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                  }`}
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Settings
                  </p>
                </Link>

                <button
                  onClick={fetchDashboardData}
                  className={`p-4 rounded-lg border-2 border-dashed transition-colors hover:border-solid text-center ${
                    isDark 
                      ? 'border-gray-600 hover:border-orange-500 hover:bg-gray-700' 
                      : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Refresh Data
                  </p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Recent Activity
              </h3>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order._id} className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getStatusIcon(order.status)}</span>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            Order #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(order.orderDate).toLocaleDateString()} • {order.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <p className={`text-sm font-medium mt-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          Rs.{order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  No recent orders. Start shopping to see your activity here!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                All Orders ({orders.length})
              </h3>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  No Orders Yet
                </h4>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  You haven't placed any orders yet. Start shopping to see your orders here!
                </p>
                <Link
                  to="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className={`border rounded-lg p-6 ${
                    isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 mb-2 md:mb-0">
                        <span className="text-2xl">{getStatusIcon(order.status)}</span>
                        <div>
                          <h4 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            Order #{order._id.slice(-8).toUpperCase()}
                          </h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Placed on {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <p className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          Rs.{order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Items ({order.items.length})
                        </h5>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <p key={index} className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.name} × {item.quantity}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              +{order.items.length - 2} more items
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Shipping Address
                        </h5>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {order.shippingAddress.address}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                      </div>
                    </div>

                    {order.status === 'delivered' && order.deliveredDate && (
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          ✅ Delivered on {new Date(order.deliveredDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Profile Information
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username
                  </label>
                  <p className={`${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {userData?.username || 'Not set'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <p className={`${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {userData?.email || 'Not set'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Account Type
                  </label>
                  <p className={`${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {userData?.role ? userData.role.join(', ') : 'User'}
                  </p>
                </div>
              </div>
              
              <Link
                to="/Settings"
                className="mt-6 block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center"
              >
                Edit Profile
              </Link>
            </div>

            <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Account Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Member since:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total orders:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {stats.totalOrders}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total spent:</span>
                  <span className={`font-medium text-green-600`}>
                    Rs.{stats.totalSpent.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Average order:</span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Rs.{stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;