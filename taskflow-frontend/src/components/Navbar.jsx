import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, darkMode, setDarkMode } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/tasks"
          className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400"
        >
          TaskFlow
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/tasks"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Tasks
          </Link>
          <Link
            to="/profile"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Profile
          </Link>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xl"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {user?.isPremium && (
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              PREMIUM
            </span>
          )}

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Hi, {user?.name?.split(" ")[0]}
          </span>

          <Link to="/profile">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-2xl"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-3 border-t dark:border-gray-700">
          <Link
            to="/tasks"
            onClick={() => setMenuOpen(false)}
            className="block py-2"
          >
            Tasks
          </Link>
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="block py-2"
          >
            Profile
          </Link>
          <button onClick={() => setDarkMode(!darkMode)} className="block py-2">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          {user?.isPremium && (
            <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              PREMIUM
            </span>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
