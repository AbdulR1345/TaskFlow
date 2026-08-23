import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await API.post('/auth/register', formData);
      toast.success(res.data.message || 'Registration successful! Check your email.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Create Account</h2>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-5 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-5 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-5 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white pr-12"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl hover:bg-indigo-700 transition font-medium"
          >
            Register
          </button>
        </form>

        <div className="my-6 text-center text-gray-500 dark:text-gray-400">OR</div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <img 
            src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" 
            alt="Google" 
            className="h-5" 
          />
          Continue with Google
        </button>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;