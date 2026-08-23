import { useState } from 'react';
import API from '../utils/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      toast.success('Reset link sent! Check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-2 dark:text-white">
          Forgot Password?
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Enter your email and we'll send you a reset link
        </p>

        {isSubmitted ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Check your email</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link 
              to="/login" 
              className="text-indigo-600 hover:underline font-medium"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-5 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl hover:bg-indigo-700 transition font-medium disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {!isSubmitted && (
          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;