import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  User,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]); // Users to display on current page
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [healthCenters, setHealthCenters] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // Number of users per page
  const [totalPages, setTotalPages] = useState(1);

  const token = Cookies.get('token');
  const API_BASE_URL = import.meta.env.VITE_API_KEY;

  // Available roles
  const roles = [
    { value: 'data_manager', label: 'Data Manager' },
    { value: 'head_of_community_workers_at_helth_center', label: 'Head of Community Workers' },
    { value: 'pediatrition', label: 'Pediatrician' },
    { value: 'admin', label: 'Admin' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    role: '',
    gender: 'Male',
    address: '',
    healthCenterId: '',
  });

  // Fetch users and health centers on component mount
  useEffect(() => {
    fetchUsers();
    fetchHealthCenters();
  }, []);

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (user) =>
          `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, roleFilter, users]);

  // Update displayed users when filteredUsers or pagination changes
  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(filteredUsers.length / usersPerPage);
    setTotalPages(total > 0 ? total : 1);

    // Get current users
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    setDisplayedUsers(currentUsers);
  }, [filteredUsers, currentPage, usersPerPage]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('error', error.response?.data?.message || 'Failed to load users');
    }
  };

  const fetchHealthCenters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/healthcenters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHealthCenters(response.data || []);
    } catch (error) {
      console.error('Error fetching health centers:', error);
      showAlert('error', error.response?.data?.message || 'Failed to load health centers');
    }
  };

  const handleAddUser = async () => {
    try {
      // Validate required fields
      if (!formData.firstname || !formData.lastname || !formData.email || !formData.role) {
        showAlert('error', 'Please fill all required fields');
        return;
      }

      // Validate health center for specific role
      if (
        formData.role === 'head_of_community_workers_at_helth_center' &&
        !formData.healthCenterId
      ) {
        showAlert('error', 'Please select a health center for this role');
        return;
      }

      // Format phone number
      const phone = formData.phone.startsWith('+250') ? formData.phone : `+250${formData.phone}`;

      // Prepare data in required format
      const userData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: phone,
        role: formData.role,
        gender: formData.gender,
        ...(formData.address && { address: formData.address }),
        ...(formData.healthCenterId && { healthCenterId: formData.healthCenterId }),
      };

      const response = await axios.post(`${API_BASE_URL}/users/addUser`, userData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const newUser = { id: response.data.id || Date.now(), ...userData };
      setUsers((prev) => [...prev, newUser]);
      setFilteredUsers((prev) => [...prev, newUser]);

      setIsAddModalOpen(false);
      resetForm();
      showAlert('success', 'User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      showAlert('error', error.response?.data?.message || 'Failed to add user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!currentUser) return;

      if (!formData.firstname || !formData.lastname || !formData.email || !formData.role) {
        showAlert('error', 'Please fill all required fields');
        return;
      }

      // Additional validation for health center when role is head_of_community_workers_at_helth_center
      if (
        formData.role === 'head_of_community_workers_at_helth_center' &&
        !formData.healthCenterId
      ) {
        showAlert('error', 'Please select a health center for this role');
        return;
      }

      // Prepare the data to be sent
      const userData = {
        ...formData,
        phone: formData.phone.startsWith('+250') ? formData.phone : `250${formData.phone}`,
      };

      const token = Cookies.get('token');

      await axios.put(`${API_BASE_URL}/users/update/${currentUser.id}`, userData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUsers = users.map((user) =>
        user.id === currentUser.id ? { ...user, ...userData } : user
      );

      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      setIsViewModalOpen(false);
      resetForm();
      setCurrentUser(null);
      showAlert('success', 'User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('error', error.response?.data?.message || 'Failed to update user');
    }
  };

  // Handle phone input change to ensure proper formatting
  const handlePhoneChange = (e) => {
    let value = e.target.value;

    // Remove any non-digit characters
    value = value.replace(/\D/g, '+');

    // If it starts with 250, replace with +250
    // if (value.startsWith('250')) {
    //   value = `+${value}`;
    // }
    // // If it doesn't start with +, add +250
    // else if (!value.startsWith('+')) {
    //   value = `+250${value}`;
    // }

    // Limit to 13 characters (+250 followed by 9 digits)
    // if (value.length > 13) {
    //   value = value.substring(0, 13);
    // }

    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));
  };

  const handleDeleteUser = (userId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = Cookies.get('token');

          await axios.delete(`${API_BASE_URL}/users/delete/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const updatedUsers = users.filter((user) => user.id !== userId);
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers);

          showAlert('success', 'User deleted successfully');
        } catch (error) {
          console.error('Error deleting user:', error);
          showAlert('error', error.response?.data?.message || 'Failed to delete user');
        }
      }
    });
  };

  const getHealthCenterName = (id) => {
    if (!id) return 'Not assigned';
    const center = healthCenters.find((center) => center.id === id);
    return center ? center.name : 'Unknown';
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          `${user.firstname} ${user.lastname}`.toLowerCase().includes(value.toLowerCase()) ||
          user.email.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      role: value,
      // Reset health center when role changes (unless it's head_of_community_workers_at_helth_center)
      healthCenterId:
        value === 'head_of_community_workers_at_helth_center' ? prev.healthCenterId : '',
    }));
  };

  const handleViewUser = (user) => {
    setCurrentUser(user);

    setFormData({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      address: user.address || '',
      healthCenterId: user.healthCenterId || '',
    });

    setIsViewModalOpen(true);
    setIsEditMode(false);
  };

  const resetForm = () => {
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      role: '',
      gender: 'Male',
      address: '',
      healthCenterId: '',
    });
  };

  const showAlert = (icon, title) => {
    Swal.fire({
      icon,
      title,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // Pagination functions
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Check if current role is head_of_community_workers_at_helth_center
  const isHeadOfCommunityWorkers = formData.role === 'head_of_community_workers_at_helth_center';

  return (
    <div className="bg-white min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-600">User Management</h1>
        <p className="text-gray-600">Manage system users</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex gap-4 w-full">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="relative w-full md:w-64">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User size={16} className="text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstname} {user.lastname}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 ml-3"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {filteredUsers.length > usersPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * usersPerPage, filteredUsers.length)}
              </span>{' '}
              of <span className="font-medium">{filteredUsers.length}</span> users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-green-50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-green-700">Add New User</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">+250</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone.replace('+250', '')}
                    onChange={handlePhoneChange}
                    className="w-full pl-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="78XXXXXXX"
                    maxLength={9}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Health Center - only shown for head_of_community_workers_at_helth_center role */}
              {isHeadOfCommunityWorkers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Health Center*
                  </label>
                  <select
                    name="healthCenterId"
                    value={formData.healthCenterId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required={isHeadOfCommunityWorkers}
                  >
                    <option value="">Select Health Center</option>
                    {healthCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role*</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={handleAddUser}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit User Modal */}
      {isViewModalOpen && currentUser && (
        <div className="fixed inset-0 bg-green-50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-green-700">
                {isEditMode ? 'Edit User' : 'User Details'}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <button
                    className="text-green-600 hover:text-green-900"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Edit size={20} />
                  </button>
                )}
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditMode(false);
                    setCurrentUser(null);
                  }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                ) : (
                  <p className="text-gray-800">{currentUser.firstname}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                ) : (
                  <p className="text-gray-800">{currentUser.lastname}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                ) : (
                  <p className="text-gray-800">{currentUser.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-800">{currentUser.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                {isEditMode ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-800">{currentUser.gender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-800">{currentUser.address}</p>
                )}
              </div>

              {/* Health Center - only shown for head_of_community_workers_at_helth_center role */}
              {(isHeadOfCommunityWorkers ||
                currentUser.role === 'head_of_community_workers_at_helth_center') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Health Center
                  </label>
                  {isEditMode ? (
                    <select
                      name="healthCenterId"
                      value={formData.healthCenterId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required={isHeadOfCommunityWorkers}
                    >
                      <option value="">Select Health Center</option>
                      {healthCenters.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-800">
                      {getHealthCenterName(currentUser.healthCenterId)}
                    </p>
                  )}
                </div>
              )}

              <div className={isEditMode ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                {isEditMode ? (
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleRoleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-800">{currentUser.role.replace(/_/g, ' ')}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditMode(false);
                  setCurrentUser(null);
                }}
              >
                {isEditMode ? 'Cancel' : 'Close'}
              </button>
              {isEditMode && (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  onClick={handleUpdateUser}
                >
                  Update User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
