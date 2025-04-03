import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

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
    appointmentsByStatus: {}
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response);
        setStats({
          totalUsers: response.data?.totalUsers || 0,
          users: response.data?.users || {},
          totalBorns: response.data?.totalBorns || 0,
          totalBabies: response.data?.totalBabies || 0,
          totalHealthCenters: response.data?.totalHealthCenters || 0,
          totalAppointments: response.data?.totalAppointments || 0,
          appointmentsByStatus: response.data?.appointmentsByStatus || {}
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
  const isPediatrician = userRole === 'pediatrition';

  // Format role names for display
  const formatRoleName = (role) => {
    if (!role) return '';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
    labels: safeGetKeys(stats.users).map(role => formatRoleName(role)),
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

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
    </div>
  );
  
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-green-800">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      </div>

      {/* Charts Section - Only render if there's data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                      pointStyle: 'circle'
                    }
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
                      pointStyle: 'circle'
                    }
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
      </div>

      {/* Detailed Stats - Only render if there's data */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isPediatrician && safeGetKeys(stats.users).length > 0 && (
          <StatsList 
            title="User Roles Breakdown" 
            data={Object.entries(stats.users).reduce((acc, [key, value]) => ({
              ...acc,
              [formatRoleName(key)]: value
            }), {})} 
          />
        )}
        {safeGetKeys(stats.appointmentsByStatus).length > 0 && (
          <StatsList 
            title="Appointment Status" 
            data={stats.appointmentsByStatus} 
          />
        )}
      </div>
    </div>
  );
};

// Reusable components remain the same
const StatCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold text-green-700">{value}</p>
  </div>
);

const ChartContainer = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4 text-green-800">{title}</h2>
    <div className="h-64 sm:h-80 md:h-96 flex justify-center">{children}</div>
  </div>
);

const StatsList = ({ title, data }) => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4 text-green-800">{title}</h2>
    <ul className="divide-y divide-gray-100">
      {Object.entries(data).map(([key, value]) => (
        <li key={key} className="flex justify-between py-3">
          <span className="capitalize text-gray-600">{key}</span>
          <span className="font-medium text-green-700">{value}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default Dashboard;