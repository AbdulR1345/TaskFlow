import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false); // Prevent double call

  useEffect(() => {
    const verify = async () => {
      if (hasVerified.current) return; // Stop second call
      hasVerified.current = true;

      try {
        const res = await API.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    if (token) {
      verify();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl text-center">
        
        {status === 'verifying' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold dark:text-white">Verifying your email...</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">{message}</p>
            <Link 
              to="/login" 
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 transition"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">{message}</p>
            <Link 
              to="/login" 
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 transition"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;