import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Simple Navbar */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-indigo-600">TaskFlow</h1>
              <div className="flex items-center gap-6 text-sm">
                <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={
              <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-6">
                  Manage Your Tasks Efficiently
                </h2>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                  A powerful task management app built with React + Node.js
                </p>
                <div className="flex justify-center gap-4">
                  <a 
                    href="/login"
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-indigo-700 transition"
                  >
                    Login
                  </a>
                  <a 
                    href="/register"
                    className="border border-gray-300 px-8 py-3 rounded-xl text-lg font-medium hover:bg-gray-50 transition"
                  >
                    Register
                  </a>
                </div>
              </div>
            } />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Placeholder for future tasks page */}
            <Route path="/tasks" element={<div className="p-10 text-center text-2xl">Tasks Page Coming Soon...</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;