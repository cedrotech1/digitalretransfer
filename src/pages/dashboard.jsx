import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = Cookies.get('token');
  const userRole = Cookies.get('role');
  const API_BASE_URL = import.meta.env.VITE_API_KEY;

  const [stats, setStats] = useState({
    totalUsers: 0,
    users: {},
    totalBorns: 0,
    totalBabies: 0,
    totalHealthCenters: 0,
    totalAppointments: 0,
    appointmentsByStatus: {},
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats({
          totalUsers: response.data?.totalUsers || 0,
          users: response.data?.users || {},
          totalBorns: response.data?.totalBorns || 0,
          totalBabies: response.data?.totalBabies || 0,
          totalHealthCenters: response.data?.totalHealthCenters || 0,
          totalAppointments: response.data?.totalAppointments || 0,
          appointmentsByStatus: response.data?.appointmentsByStatus || {},
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, API_BASE_URL]);

  const COLORS = ['#2ecc71', '#27ae60', '#16a085', '#1abc9c', '#3498db'];

  // Check if user is pediatrician
  const isPediatrician = userRole === 'doctor';

  // Format role names for display
  const formatRoleName = (role) => {
    if (!role) return '';
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Safely get object keys with fallback
  const safeGetKeys = (obj) => {
    return obj ? Object.keys(obj) : [];
  };

  // Safely get object values with fallback
  const safeGetValues = (obj) => {
    return obj ? Object.values(obj) : [];
  };

  // Prepare data for pie chart with null checks
  const userRolesData = {
    labels: safeGetKeys(stats.users).map((role) => formatRoleName(role)),
    datasets: [
      {
        data: safeGetValues(stats.users),
        backgroundColor: COLORS,
        borderWidth: 1,
        hoverOffset: 20,
      },
    ],
  };

  const appointmentStatusData = {
    labels: safeGetKeys(stats.appointmentsByStatus),
    datasets: [
      {
        data: safeGetValues(stats.appointmentsByStatus),
        backgroundColor: ['#2ecc71', '#3498db', '#e74c3c'],
        borderWidth: 1,
      },
    ],
  };

  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-green-800">Dashboard Overview</h1>

      {/* Summary Cards - Skeleton Loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: isPediatrician ? 2 : 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="bg-white p-4 rounded-lg shadow-md animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          <>
            {!isPediatrician && (
              <>
                <StatCard title="Total Users" value={stats.totalUsers} />
                <StatCard title="Health Centers" value={stats.totalHealthCenters} />
              </>
            )}
            <StatCard title="Total Born Records" value={stats.totalBorns} />
            <StatCard title="Total Babies" value={stats.totalBabies} />
            {!isPediatrician && (
              <StatCard title="Total Appointments" value={stats.totalAppointments} />
            )}
          </>
        )}
      </div>

      {/* Charts Section - Skeleton Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {loading ? (
          <>
            <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-64 sm:h-80 md:h-96 bg-gray-100 rounded"></div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-64 sm:h-80 md:h-96 bg-gray-100 rounded"></div>
            </div>
          </>
        ) : (
          <>
            {!isPediatrician && safeGetKeys(stats.users).length > 0 && (
              <ChartContainer title="User Roles Distribution">
                <Pie
                  data={userRolesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: 'circle',
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </ChartContainer>
            )}

            {safeGetKeys(stats.appointmentsByStatus).length > 0 && (
              <ChartContainer title="Appointment Status">
                <Pie
                  data={appointmentStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: 'circle',
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </ChartContainer>
            )}
          </>
        )}
      </div>

      {/* Detailed Stats - Skeleton Loading */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`stat-skeleton-${i}`} className="flex justify-between py-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`appointment-skeleton-${i}`} className="flex justify-between py-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {!isPediatrician && safeGetKeys(stats.users).length > 0 && (
              <StatsList
                title="User Roles Breakdown"
                data={Object.entries(stats.users).reduce(
                  (acc, [key, value]) => ({
                    ...acc,
                    [formatRoleName(key)]: value,
                  }),
                  {}
                )}
              />
            )}
            {safeGetKeys(stats.appointmentsByStatus).length > 0 && (
              <StatsList title="Appointment Status" data={stats.appointmentsByStatus} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// StatCard component with improved responsiveness
const StatCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow min-w-0">
    <h3 className="text-gray-600 text-sm font-medium truncate">{title}</h3>
    <p className="text-3xl font-bold text-green-700 truncate">{value}</p>
  </div>
);

// ChartContainer component
const ChartContainer = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md min-w-0">
    <h2 className="text-xl font-semibold mb-4 text-green-800 truncate">{title}</h2>
    <div className="h-64 sm:h-80 md:h-96 flex justify-center min-w-0">{children}</div>
  </div>
);

// StatsList component
const StatsList = ({ title, data }) => (
  <div className="bg-white p-4 rounded-lg shadow-md min-w-0">
    <h2 className="text-xl font-semibold mb-4 text-green-800 truncate">{title}</h2>
    <ul className="divide-y divide-gray-100">
      {Object.entries(data).map(([key, value]) => (
        <li key={key} className="flex justify-between py-3">
          <span className="capitalize text-gray-600 truncate pr-2">{key}</span>
          <span className="font-medium text-green-700">{value}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default Dashboard;
