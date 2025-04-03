import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, User } from 'lucide-react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Set base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_KEY;

function Navbar({ toggleSidebar }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Close notifications if screen size changes to mobile
      if (window.innerWidth < 768 && showNotifications) {
        setShowNotifications(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showNotifications]);

  useEffect(() => {
    const userEmail = Cookies.get('email');
    if (userEmail) {
      setEmail(userEmail);
    }

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const token = Cookies.get('token');
        const response = await axios.get(`${API_BASE_URL}/notification`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Handle different response structures
        const data = response.data?.data || response.data || [];
        const unreadCount = response.data?.unreadCount || 0;

        // Ensure data is an array before filtering
        const notifications = Array.isArray(data) ? data : [];
        setNotifications(notifications.filter((n) => !n?.isRead));
        setUnreadCount(unreadCount);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchNotifications();

    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate]);

  // Format timestamp to relative time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 mr-2 md:hidden"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationsRef}>
            <button
              className="relative p-2 rounded-full hover:bg-gray-100"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className={`absolute ${
                  windowWidth < 640
                    ? 'fixed inset-0 m-0 w-full h-full rounded-none'
                    : 'right-0 mt-2 w-80 rounded-md'
                } bg-white shadow-lg z-50 border border-gray-200`}
              >
                <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                  {windowWidth < 640 && (
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div
                  className={`${windowWidth < 640 ? 'h-[calc(100%-100px)]' : 'max-h-80'} overflow-y-auto`}
                >
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-sm text-gray-500">
                      No unread notifications
                    </div>
                  )}
                </div>
                <div className="p-2 text-center border-t border-gray-200">
                  <button
                    className="text-xs text-green-600 hover:text-green-800 font-medium"
                    onClick={() => {
                      navigate('/notifications');
                      setShowNotifications(false);
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hide user icon on small devices */}
          <div className="hidden md:flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">{getGreeting()}</span>
              <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                {email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
