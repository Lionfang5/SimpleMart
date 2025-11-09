import { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import UserTable from './UserTable';
import ProductForm from './ProductForm';
import OrderManagement from './OrderManagement';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Admin = () => {
	const [users, setUsers] = useState([]);
	const [products, setProducts] = useState([]);
	const [orders, setOrders] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [authorized, setAuthorized] = useState(true);
	const [activeTab, setActiveTab] = useState('dashboard');
	const { isDark } = useTheme();

	// Fetch users, products, and orders
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const userRes = await authFetch('http://localhost:5000/user-data');
				if (userRes.status === 401 || userRes.status === 403) {
					setAuthorized(false);
					setError('You are not authorized to access this page.');
					return;
				}

				const userData = await userRes.json();
				if (!userData.role || !userData.role.includes('admin')) {
					setAuthorized(false);
					setError('You need admin privileges to access this page.');
					return;
				}

				// Fetch admin data
				const [adminUsersRes, productRes, orderRes] = await Promise.all([
					authFetch('http://localhost:5000/users'),
					authFetch('http://localhost:5000/products'),
					authFetch('http://localhost:5000/orders'),
				]);

				const adminUsersData = await adminUsersRes.json();
				const productData = await productRes.json();
				
				// Handle orders response more carefully
				let ordersData = [];
				if (orderRes.ok) {
					try {
						ordersData = await orderRes.json();
						// Ensure ordersData is an array
						if (!Array.isArray(ordersData)) {
							console.warn('Orders data is not an array:', ordersData);
							ordersData = [];
						}
					} catch (err) {
						console.error('Error parsing orders JSON:', err);
						ordersData = [];
					}
				} else {
					console.warn('Orders fetch failed:', orderRes.status, orderRes.statusText);
				}

				setUsers(adminUsersData);
				setProducts(productData);
				setOrders(ordersData);
				setError(null);
			} catch (err) {
				console.error('Admin data fetch error:', err);
				setError(err.message);
				setAuthorized(false);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Compute dashboard stats
	const totalUsers = users.length;
	const totalProducts = products.length;
	const totalOrders = orders.length;
	const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
	
	const bestSellingProduct = products.reduce((prev, curr) => {
		return curr.sold && (!prev || curr.sold > prev.sold) ? curr : prev;
	}, null);

	// Chart data: Products sold by category
	const categoryData = products.reduce((acc, product) => {
		const category = product.category || 'Uncategorized';
		const existing = acc.find((c) => c.name === category);
		if (existing) {
			existing.value += product.sold || 0;
		} else {
			acc.push({ name: category, value: product.sold || 0 });
		}
		return acc;
	}, []);

	// Order status distribution
	const orderStatusData = orders.reduce((acc, order) => {
		const status = order.status || 'pending';
		const existing = acc.find(s => s.name === status);
		if (existing) {
			existing.value += 1;
		} else {
			acc.push({ name: status, value: 1 });
		}
		return acc;
	}, []);

	if (loading) {
		return (
			<div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
				<div className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p>Loading admin dashboard...</p>
				</div>
			</div>
		);
	}

	if (!authorized) {
		return (
			<div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
				<div className={`max-w-md mx-auto text-center p-8 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
					<h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Access Denied</h1>
					<p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
						You don't have permission to access the admin dashboard.
					</p>
					<button
						onClick={() => (window.location.href = '/')}
						className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
					>
						Go to Homepage
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
			<h1 className={`text-3xl font-bold text-center mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
				Admin Dashboard
			</h1>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
					{error}
				</div>
			)}

			{/* === DASHBOARD CARDS === */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
				<div className={`p-4 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
					<h2 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</h2>
					<p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totalUsers}</p>
				</div>
				<div className={`p-4 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
					<h2 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</h2>
					<p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totalProducts}</p>
				</div>
				<div className={`p-4 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
					<h2 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</h2>
					<p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totalOrders}</p>
				</div>
				<div className={`p-4 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
					<h2 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</h2>
					<p className={`text-2xl font-bold text-green-600`}>Rs.{totalRevenue.toFixed(2)}</p>
				</div>
			</div>

			{/* === CHARTS === */}
			{activeTab === 'dashboard' && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<div className={`p-4 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
						<h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
							Sales by Category
						</h2>
						<div style={{ width: '100%', height: 250 }}>
							<ResponsiveContainer>
								<BarChart data={categoryData}>
									<CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#e0e0e0'} />
									<XAxis dataKey="name" stroke={isDark ? '#ccc' : '#666'} />
									<YAxis stroke={isDark ? '#ccc' : '#666'} />
									<Tooltip 
										contentStyle={{
											backgroundColor: isDark ? '#374151' : '#ffffff',
											border: `1px solid ${isDark ? '#6b7280' : '#e5e7eb'}`,
											color: isDark ? '#ffffff' : '#000000'
										}}
									/>
									<Bar dataKey="value" fill="#3b82f6" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className={`p-4 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
						<h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
							Order Status Distribution
						</h2>
						<div style={{ width: '100%', height: 250 }}>
							<ResponsiveContainer>
								<BarChart data={orderStatusData}>
									<CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#e0e0e0'} />
									<XAxis dataKey="name" stroke={isDark ? '#ccc' : '#666'} />
									<YAxis stroke={isDark ? '#ccc' : '#666'} />
									<Tooltip 
										contentStyle={{
											backgroundColor: isDark ? '#374151' : '#ffffff',
											border: `1px solid ${isDark ? '#6b7280' : '#e5e7eb'}`,
											color: isDark ? '#ffffff' : '#000000'
										}}
									/>
									<Bar dataKey="value" fill="#10b981" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			)}

			{/* === TABS FOR MANAGEMENT === */}
			<div className={`flex border-b mb-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
				{['dashboard', 'orders', 'users', 'products'].map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`py-2 px-4 font-semibold transition-colors ${
							activeTab === tab 
								? `border-b-2 border-blue-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}` 
								: `${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`
						}`}
					>
						{tab === 'dashboard' ? 'Overview' : 
						 tab === 'orders' ? 'Order Management' :
						 tab === 'users' ? 'User Management' : 'Product Management'}
					</button>
				))}
			</div>

			{/* Conditional rendering based on active tab */}
			{activeTab === 'orders' && (
				<OrderManagement 
					orders={orders} 
					setOrders={setOrders}
				/>
			)}
			{activeTab === 'users' && (
				<UserTable 
					users={users} 
					setUsers={setUsers} 
					setError={setError} 
				/>
			)}
			{activeTab === 'products' && (
				<ProductForm 
					products={products} 
					setProducts={setProducts} 
					setError={setError} 
				/>
			)}
		</div>
	);
};

export default Admin;