import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { authFetch } from '../utils/authFetch';

const NavBar = ({ toggleSideBar }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [userRole, setUserRole] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { cartCount, setCartItems, setCartCount } = useContext(CartContext);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));

  // Fetch user role and wishlist count when component mounts
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserRole();
      fetchWishlistCount();
    }
  }, [isLoggedIn]);

  const fetchUserRole = async () => {
    try {
      const response = await authFetch('http://localhost:5000/user-data');
      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.role || []);
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await authFetch('http://localhost:5000/wishlist/count');
      if (response.ok) {
        const data = await response.json();
        setWishlistCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist count:', err);
      setWishlistCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setCartItems([]);
    setCartCount(0);
    setWishlistCount(0);
    setUserRole([]);
    navigate('/login');
  };

  const toggleProfile = () => {
    setShowProfile(prev => !prev);
  };

  const isAdmin = userRole.includes('admin');

  return (
   <nav className={`sticky top-0 z-50 shadow-lg border-b flex items-center justify-between px-6 py-3 ${
     isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
   }`}>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSideBar}
          className={`p-2 rounded transition-colors ${
            isDark 
              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
          }`}
          aria-label="Open sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h18m-9-9v18"/>
          </svg>
        </button>
        <Link to="/" className={`text-xl font-bold ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          MART
        </Link>
        <Link to="/" className={`transition-colors ${
          isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
        }`}>
          Home
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {isLoggedIn ? (
          <>
            {/* Dashboard Links */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-red-400 hover:bg-gray-800' 
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                }`}
                title="Admin Dashboard"
              >
                <span>🛡️</span>
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}
            
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-green-400 hover:bg-gray-800' 
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
              title="My Dashboard"
            >
              <span>📊</span>
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className={`relative flex items-center space-x-1 transition-colors ${
                isDark ? 'text-gray-300 hover:text-red-400' : 'text-gray-700 hover:text-red-600'
              }`}
              title="My Wishlist"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden md:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/Cart"
              className={`relative flex items-center space-x-1 transition-colors ${
                isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span>🛒</span>
              <span className="hidden md:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <div className="relative">
              <button
                onClick={toggleProfile}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <span>👤</span>
                <span className="hidden md:inline">Profile</span>
                <svg className={`w-4 h-4 transition-transform ${showProfile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              {showProfile && (
                <div className={`absolute right-0 mt-2 w-56 border rounded-lg shadow-xl z-10 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="p-2">
                    {/* User Info Header */}
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Signed in as
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {userRole.join(', ') || 'User'}
                      </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setShowProfile(false)}
                        className={`flex items-center px-4 py-2 text-sm rounded transition-colors ${
                          isDark 
                            ? 'text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3">📊</span>
                        My Dashboard
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setShowProfile(false)}
                        className={`flex items-center px-4 py-2 text-sm rounded transition-colors ${
                          isDark 
                            ? 'text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3">❤️</span>
                        My Wishlist
                        {wishlistCount > 0 && (
                          <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-1">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/Account"
                        onClick={() => setShowProfile(false)}
                        className={`flex items-center px-4 py-2 text-sm rounded transition-colors ${
                          isDark 
                            ? 'text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3">👤</span>
                        Your account
                      </Link>

                      <Link
                        to="/Settings"
                        onClick={() => setShowProfile(false)}
                        className={`flex items-center px-4 py-2 text-sm rounded transition-colors ${
                          isDark 
                            ? 'text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3">⚙️</span>
                        Settings
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfile(false)}
                          className={`flex items-center px-4 py-2 text-sm rounded transition-colors ${
                            isDark 
                              ? 'text-red-400 hover:bg-gray-700' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <span className="mr-3">🛡️</span>
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className={`pt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        <span className="mr-3">🚪</span>
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            
            <Link
              to="/login"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>🔑</span>
              <span>Sign In</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;