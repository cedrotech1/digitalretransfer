import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Hospital, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function HealthCenterManagement() {
  const [healthCenters, setHealthCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectors, setSectors] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentCenter, setCurrentCenter] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sectorId: '',
  });

  const token = Cookies.get('token');
  const API_BASE_URL = import.meta.env.VITE_API_KEY;
  // Fetch health centers and sectors on component mount
  useEffect(() => {
    fetchHealthCenters();
    fetchSectors();
  }, []);

  const fetchHealthCenters = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/healthcenters`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const centers = response.data || [];

      setHealthCenters(centers);
      setFilteredCenters(centers);
    } catch (error) {
      console.error('Error fetching health centers:', error);
      showAlert('error', 'Failed to load health centers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSectors = async () => {
    try {
      const token = Cookies.get('token'); // Get token from cookies

      const response = await axios.get(`${API_BASE_URL}/address/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      // Extract sectors from the nested structure
      const sectorsData = [];
      if (data?.data?.length) {
        data.data.forEach((province) => {
          province.districts?.forEach((district) => {
            district.sectors?.forEach((sector) => {
              sectorsData.push({
                id: sector.id,
                name: sector.name,
              });
            });
          });
        });
      }

      setSectors(sectorsData);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      showAlert('error', 'Failed to load sectors');
    }
  };

  const handleAddHealthCenter = async () => {
    try {
      if (!formData.name || !formData.sectorId) {
        showAlert('error', 'Please fill all required fields');
        return;
      }

      setIsLoading(true);
      const token = Cookies.get('token');

      const centerToAdd = {
        name: formData.name,
        sectorId: parseInt(formData.sectorId),
      };

      const response = await axios.post(`${API_BASE_URL}/healthcenters`, centerToAdd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newCenter = {
        id: response.data.id || Date.now(),
        ...centerToAdd,
      };

      setHealthCenters((prev) => [...prev, newCenter]);
      setFilteredCenters((prev) => [...prev, newCenter]);

      setIsAddModalOpen(false);
      resetForm();
      showAlert('success', 'Health center added successfully');
    } catch (error) {
      console.error('Error adding health center:', error);
      showAlert('error', error.response?.data?.message || 'Failed to add health center');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateHealthCenter = async () => {
    try {
      if (!currentCenter) return;

      if (!formData.name || !formData.sectorId) {
        showAlert('error', 'Please fill all required fields');
        return;
      }

      setIsLoading(true);
      const token = Cookies.get('token');

      const centerToUpdate = {
        name: formData.name,
        sectorId: parseInt(formData.sectorId),
      };

      await axios.put(`${API_BASE_URL}/healthcenters/${currentCenter.id}`, centerToUpdate, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedCenters = healthCenters.map((center) =>
        center.id === currentCenter.id ? { ...center, ...centerToUpdate } : center
      );

      setHealthCenters(updatedCenters);
      setFilteredCenters(updatedCenters);

      setIsViewModalOpen(false);
      resetForm();
      setCurrentCenter(null);
      setIsEditMode(false);
      showAlert('success', 'Health center updated successfully');
    } catch (error) {
      console.error('Error updating health center:', error);
      showAlert('error', error.response?.data?.message || 'Failed to update health center');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHealthCenter = (centerId) => {
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
          setIsLoading(true);
          const token = Cookies.get('token');

          await axios.delete(`${API_BASE_URL}/healthcenters/${centerId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const updatedCenters = healthCenters.filter((center) => center.id !== centerId);
          setHealthCenters(updatedCenters);
          setFilteredCenters(updatedCenters);

          showAlert('success', 'Health center deleted successfully');
        } catch (error) {
          console.error('Error deleting health center:', error);
          showAlert('error', error.response?.data?.message || 'Failed to delete health center');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const getSectorName = (id) => {
    const sector = sectors.find((sector) => sector.id === parseInt(id));
    return sector ? sector.name : 'Unknown';
  };

  // Add these functions inside your UserManagementPage component, before the return statement

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

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role: {
        ...prev.role,
        [role]: !prev.role[role],
      },
    }));
  };

  const handleViewUser = (user) => {
    setCurrentUser(user);

    // Convert role string to object
    const roles = user.role.split('/');
    const roleObject = {
      data_manager: roles.includes('data_manager'),
      head_of_community_workers_at_helth_center: roles.includes(
        'head_of_community_workers_at_helth_center'
      ),
      pediatrition: roles.includes('pediatrition'),
      admin: roles.includes('admin'),
    };

    setFormData({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: roleObject,
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
      role: {
        data_manager: false,
        head_of_community_workers_at_helth_center: false,
        pediatrition: false,
        admin: false,
      },
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

  return (
    <div className="bg-white min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-600">Health Center Management</h1>
        <p className="text-gray-600">Manage health centers in the system</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search health centers..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          disabled={isLoading}
        >
          <Plus size={18} />
          Add New Health Center
        </button>
      </div>

      {/* Health Centers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading && <div className="p-4 text-center text-gray-500">Loading...</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Health Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Sector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Head
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCenters.length > 0 ? (
                filteredCenters.map((center, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Hospital size={16} className="text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{center.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getSectorName(center.sectorId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  {center?.head ? `${center.head.firstname} ${center.head.lastname}` : "Not Found"}
</td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="text-red-600 hover:text-red-900 ml-3"
                        onClick={() => handleDeleteHealthCenter(center.id)}
                        disabled={isLoading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    {isLoading ? 'Loading...' : 'No health centers found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Health Center Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-green-50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-green-700">Add New Health Center</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isLoading}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Health Center Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector*</label>
                <select
                  name="sectorId"
                  value={formData.sectorId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Sector</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                onClick={handleAddHealthCenter}
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Health Center'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Health Center Modal */}
      {isViewModalOpen && currentCenter && (
        <div className="fixed inset-0 bg-green-50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-green-700">
                {isEditMode ? 'Edit Health Center' : 'Health Center Details'}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <button
                    className="text-green-600 hover:text-green-900"
                    onClick={() => setIsEditMode(true)}
                    disabled={isLoading}
                  >
                    <Edit size={20} />
                  </button>
                )}
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditMode(false);
                    setCurrentCenter(null);
                  }}
                  disabled={isLoading}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Health Center Name
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isLoading}
                  />
                ) : (
                  <p className="text-gray-800">{currentCenter.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                {isEditMode ? (
                  <select
                    name="sectorId"
                    value={formData.sectorId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select Sector</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-800">{getSectorName(currentCenter.sectorId)}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditMode(false);
                  setCurrentCenter(null);
                }}
                disabled={isLoading}
              >
                {isEditMode ? 'Cancel' : 'Close'}
              </button>
              {isEditMode && (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                  onClick={handleUpdateHealthCenter}
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Health Center'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
