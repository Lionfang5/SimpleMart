import { Link, useLocation } from "react-router-dom";
import { useTheme } from '../contexts/ThemeContext';
import { FaAppleAlt, FaUtensils, FaTshirt, FaTv, FaHome, FaTimes } from 'react-icons/fa';

const menuItems = [
  { to: "/level1", label: "Groceries", icon: <FaAppleAlt /> },
  { to: "/level2", label: "Utensils / Toys", icon: <FaUtensils /> },
  { to: "/level3", label: "Clothes & Fashion", icon: <FaTshirt /> },
  { to: "/level4", label: "Electronic", icon: <FaTv /> },
  { to: "/level5", label: "Household", icon: <FaHome /> },
];

const SideBar = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-10 transition-opacity duration-300 ${
          isOpen ? "opacity-40 pointer-events-auto" : "opacity-0 pointer-events-none"
        } ${isDark ? 'bg-gray-900' : 'bg-black'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed top-0 left-0 w-72 h-full shadow-2xl p-6 flex flex-col gap-6 z-20 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
      >
        <button
          aria-label="Close sidebar"
          className={`self-end text-3xl font-bold hover:text-red-500 transition-colors ${
            isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'
          }`}
          onClick={onClose}
        >
          <FaTimes />
        </button>

        <nav className="flex flex-col gap-3" role="menu">
          {menuItems.map(({ to, label, icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                role="menuitem"
                className={`flex items-center gap-3 px-5 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  isActive
                    ? isDark
                      ? 'bg-blue-700 text-white shadow-lg'
                      : 'bg-blue-200 text-blue-800 shadow-lg'
                    : isDark
                      ? 'hover:bg-gray-700 hover:text-white'
                      : 'hover:bg-blue-100 hover:text-blue-700'
                }`}
                onClick={onClose}
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Optional footer */}
        <footer className="mt-auto text-xs text-center opacity-60">
          &copy; {new Date().getFullYear()} YourAppName
        </footer>
      </aside>
    </>
  );
};

export default SideBar;
