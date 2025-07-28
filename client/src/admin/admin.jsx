import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import UserTable from "./UserTable";
import ProductForm from "./ProductForm";
import { useTheme } from "../contexts/ThemeContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isDark } = useTheme();

  // Fetch users, products, and (later) orders
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userRes = await authFetch("http://localhost:5000/user-data");
        if (userRes.status === 401 || userRes.status === 403) {
          setAuthorized(false);
          setError("You are not authorized to access this page.");
          return;
        }

        const userData = await userRes.json();
        if (!userData.role || !userData.role.includes("admin")) {
          setAuthorized(false);
          setError("You need admin privileges to access this page.");
          return;
        }

        // Fetch admin data
        const [adminUsersRes, productRes, orderRes] = await Promise.all([
          authFetch("http://localhost:5000/users"),
          authFetch("http://localhost:5000/products"),
          authFetch("http://localhost:5000/orders") // <- OPTIONAL (we’ll plan for it)
        ]);

        const adminUsersData = await adminUsersRes.json();
        const productData = await productRes.json();
        const ordersData = orderRes.ok ? await orderRes.json() : [];

        setUsers(adminUsersData);
        setProducts(productData);
        setOrders(ordersData);
        setError(null);
      } catch (err) {
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
  const bestSellingProduct = products.reduce((prev, curr) => {
    return curr.sold && (!prev || curr.sold > prev.sold) ? curr : prev;
  }, null);

  // Chart data: Products sold by category
  const categoryData = products.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    const existing = acc.find((c) => c.name === category);
    if (existing) {
      existing.value += product.sold || 0;
    } else {
      acc.push({ name: category, value: product.sold || 0 });
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
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Access Denied
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            You don't have permission to access the admin dashboard.
          </p>
          <button onClick={() => window.location.href = '/'} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Go to Homepage</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <h1 className="text-3xl font-bold text-center mb-6 text-white">Admin Dashboard</h1>

      {/* === DASHBOARD CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-gray-400 text-sm">Total Users</h2>
          <p className="text-2xl font-bold text-white">{totalUsers}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-gray-400 text-sm">Total Products</h2>
          <p className="text-2xl font-bold text-white">{totalProducts}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-gray-400 text-sm">Best Selling Product</h2>
          <p className="text-xl font-semibold text-white">
            {bestSellingProduct ? bestSellingProduct.name : "No sales yet"}
          </p>
        </div>
      </div>

      {/* === CHART === */}
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Sales by Category</h2>
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* === TABS FOR USER/PRODUCT MGMT === */}
      <div className="flex border-b border-gray-700 mb-6">
        {["dashboard", "users", "products"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 font-semibold transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-blue-400"
            }`}
          >
            {tab === "dashboard"
              ? "Overview"
              : tab === "users"
              ? "User Management"
              : "Product Management"}
          </button>
        ))}
      </div>

      {/* Conditional rendering */}
      {activeTab === "users" && (
        <UserTable users={users} setUsers={setUsers} setError={setError} />
      )}

      {activeTab === "products" && (
        <ProductForm products={products} setProducts={setProducts} setError={setError} />
      )}
    </div>
  );
};

export default Admin;
