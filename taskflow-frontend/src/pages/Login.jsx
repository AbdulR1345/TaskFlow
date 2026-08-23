import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/tasks';
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate('/tasks');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);

      // Show resend button if email is not verified
      if (message.includes('verify your email')) {
        setShowResend(true);
      }
    }
  };
  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error('Please enter your email first');
      return;
    }

    setResendLoading(true);
    try {
      await API.post('/auth/resend-verification', { email: formData.email });
      toast.success('Verification email resent! Check your inbox.');
      setShowResend(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    }
    setResendLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Welcome Back</h2>
        
        {error && (
          <div className="text-center mb-4">
            <p className="text-red-500 mb-2">{error}</p>
            
            {showResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
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

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl hover:bg-indigo-700 transition font-medium"
          >
            Login
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
          Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;