import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import { Toaster } from "react-hot-toast";
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* 👇 Add Toaster here */}
          <Toaster position="top-right" reverseOrder={false} />

          <Routes>
            <Route path="/" element={
              <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-6">TaskFlow</h1>
                <p className="text-2xl text-gray-600 mb-10">Manage your tasks with ease</p>
                <div className="space-x-4">
                  <a href="/login" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-lg inline-block hover:bg-indigo-700">
                    Login
                  </a>
                  <a href="/register" className="border-2 border-gray-300 px-8 py-4 rounded-2xl text-lg inline-block hover:bg-gray-50">
                    Register
                  </a>
                </div>
              </div>
            } />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}


export default App;