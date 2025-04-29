import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { CheckCircle, XCircle, ArrowLeft, ChevronLeft } from 'lucide-react';

const EmailVerification = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [email, setEmail] = useState(Cookies.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_KEY;
  const token = Cookies.get('token');
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!code) {
        throw new Error('Please enter verification code');
      }

      const response = await axiosInstance.post(`/users/code/${email}`, {
        code: code,
      });

      console.log('Verification response:', response.data);

      if (response.data.success) {
        setIsVerified(true);
        setActiveTab('reset'); // Move to reset password tab after verification
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCode = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await axiosInstance.post('/users/check', { email });

      if (response.data.success) {
        setActiveTab('verify');
      } else {
        throw new Error(response.data.message || 'Failed to request code');
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || err.message || 'Failed to request verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      const response = await axiosInstance.put(`/users/resetPassword/${email}`, {
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        setIsPasswordReset(true);
        setTimeout(() => {
          navigate('/login'); // Redirect to login after successful reset
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Password reset failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (activeTab === 'verify') {
      setActiveTab('request');
    } else if (activeTab === 'reset') {
      setActiveTab('verify');
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {/* Back button - only shown on verify and reset tabs */}
          {(activeTab === 'verify' || activeTab === 'reset') && (
            <button
              onClick={handleGoBack}
              className="mr-2 text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
              title="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'request' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('request')}
          >
            Request Code
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'verify' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('verify')}
            disabled={!email}
          >
            Verify Email
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'reset' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('reset')}
            disabled={!isVerified}
          >
            Reset Password
          </button>
        </div>

        {/* Request Code Tab */}
        {activeTab === 'request' && (
          <div>
            <p className="text-gray-600 mb-4">
              A verification code will be sent to your email address to verify your account.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`w-full px-3 py-2 border ${error && !validateEmail(email) ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
              {error && !validateEmail(email) && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
            <button
              onClick={handleRequestCode}
              disabled={isLoading || !validateEmail(email)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md disabled:bg-green-300"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        {/* Verify Email Tab */}
        {activeTab === 'verify' && (
          <div>
            <p className="text-gray-600 mb-4">
              Enter the verification code sent to <span className="font-semibold">{email}</span>
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="Enter 6-digit code"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <button
              onClick={handleVerifyEmail}
              disabled={isLoading || !code}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md disabled:bg-green-300"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        )}

        {/* Reset Password Tab */}
        {activeTab === 'reset' && (
          <div>
            <p className="text-gray-600 mb-4">Set a new password for your account.</p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter new password"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Confirm new password"
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md disabled:bg-green-300"
            >
              {isLoading ? 'Processing...' : 'Reset Password'}
            </button>
          </div>
        )}

        {/* Success Message (shown temporarily before redirect) */}
        {isPasswordReset && (
          <div className="fixed inset-0 bg-green-50 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">Password Reset Successful</h3>
              <p className="text-gray-600">Redirecting to login page...</p>
            </div>
          </div>
        )}
        <Link to={'/login'} className="text-green-500 mt-2 flex justify-center">
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default EmailVerification;
