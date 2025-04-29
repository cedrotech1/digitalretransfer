import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, ChevronUp, ChevronDown, ChevronsUpDown, X, Eye } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const AppointmentPage = () => {
  // State declarations
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(Cookies.get('role') || '');
  const [feedbackForm, setFeedbackForm] = useState({
    babyId: '',
    appointmentId: '',
    weight: '',
    feedback: '',
    status: 'Healthy',
  });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // API configuration
  const API_BASE_URL = import.meta.env.VITE_API_KEY;
  const token = Cookies.get('token');
  const isPediatrition = userRole === 'doctor';
  const isNurse = userRole === 'nurse';

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const showAlert = (icon, title) => {
    Swal.fire({
      icon,
      title,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // Data fetching
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get('/appointments');
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      showAlert('error', error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const response = await axiosInstance.put(`/appointments/${appointmentId}`, { status });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      return false;
    }
  };

  // Sorting logic
  const requestSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown size={16} className="ml-1 inline" />;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={16} className="ml-1 inline" />
    ) : (
      <ChevronDown size={16} className="ml-1 inline" />
    );
  };

  // Filter and sort appointments
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((appointment) => {
        const matchesAppointment =
          appointment.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.status?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPatient =
          appointment.birthRecord?.motherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.birthRecord?.motherNationalId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        return matchesAppointment || matchesPatient;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((appointment) => appointment.status === statusFilter);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate && endDate) {
          return appointmentDate >= startDate && appointmentDate <= endDate;
        } else if (startDate) {
          return appointmentDate >= startDate;
        } else if (endDate) {
          return appointmentDate <= endDate;
        }
        return true;
      });
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [appointments, searchTerm, statusFilter, dateRange, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedAppointments.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedAppointments, currentPage, itemsPerPage]);

  // Open appointment details
  const openAppointmentDetails = (appointment) => {
    setCurrentAppointment(appointment);
    setIsModalOpen(true);
    setShowFeedbackForm(false);

    // Set initial babyId to the first baby if available
    const initialBabyId = appointment.birthRecord?.babies?.[0]?.id || '';

    setFeedbackForm({
      appointmentId: appointment.id,
      babyId: initialBabyId,
      weight: '',
      status: 'Healthy',
      feedback: '',
    });
  };

  // Submit feedback
  const submitFeedback = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (
        !feedbackForm.weight ||
        !feedbackForm.status ||
        !feedbackForm.appointmentId ||
        !feedbackForm.babyId
      ) {
        showAlert('error', 'All fields are required');
        return;
      }

      // Prepare payload
      const payload = {
        appointmentId: Number(feedbackForm.appointmentId),
        babyId: Number(feedbackForm.babyId),
        weight: Number(feedbackForm.weight),
        status: feedbackForm.status,
        feedback: feedbackForm.feedback || null,
      };

      // First update the appointment status to completed
      const statusUpdated = await updateAppointmentStatus(feedbackForm.appointmentId, 'Completed');

      if (!statusUpdated) {
        throw new Error('Failed to update appointment status');
      }

      // Then submit the feedback
      await axiosInstance.post('/appointmentFeedbacks', payload);

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Feedback saved successfully!',
        showConfirmButton: false,
        timer: 1500,
      });

      // Refresh data and close modal
      await fetchAppointments();
      setShowFeedbackForm(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to save feedback';
      showAlert('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateToDMY = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Skeleton Loader Components
  const TableRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </td>
    </tr>
  );

  const InputSkeleton = () => (
    <div className="space-y-1">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-200 rounded-md"></div>
    </div>
  );

  const SelectSkeleton = () => (
    <div className="space-y-1">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-200 rounded-md"></div>
    </div>
  );

  const FeedbackCardSkeleton = () => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full md:col-span-2"></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-600">Appointments</h1>
        <p className="text-gray-600">View and manage appointment records</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {isLoading ? (
          <>
            <div className="relative w-full md:w-64 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="relative w-full md:w-48 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="w-full md:w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-full md:w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search appointments..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            <div className="w-full md:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <span className="flex items-center">to</span>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </>
        )}
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon('date')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('fatherName')}
                >
                  <div className="flex items-center">
                    Father
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Mother
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Show skeleton loaders while loading
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton key={`skeleton-${index}`} />
                ))
              ) : currentItems.length > 0 ? (
                currentItems.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateToDMY(appointment.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.birthRecord?.fatherName || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.birthRecord?.motherName || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => openAppointmentDetails(appointment)}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredAndSortedAppointments.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredAndSortedAppointments.length)}
              </span>{' '}
              of <span className="font-medium">{filteredAndSortedAppointments.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded-md ${currentPage === page ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {isModalOpen && currentAppointment && (
        <div className="fixed inset-0 bg-green-50 bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-green-700">Appointment Details</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="h-5 bg-gray-200 rounded w-32"></div>
                      <div className="h-8 w-24 bg-gray-200 rounded"></div>
                    </div>

                    {showFeedbackForm ? (
                      <div className="mt-4 bg-green-50 p-4 rounded-lg">
                        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputSkeleton />
                          <SelectSkeleton />
                          <div className="md:col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-24 bg-gray-200 rounded-md"></div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                          <div className="h-10 w-20 bg-gray-200 rounded-md"></div>
                          <div className="h-10 w-24 bg-gray-200 rounded-md"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <FeedbackCardSkeleton />
                        <FeedbackCardSkeleton />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-green-700 mb-3">
                        Appointment Information
                      </h3>
                      <div className="space-y-2">
                        <p>
                          <span className="font-semibold">Date:</span>{' '}
                          {formatDateToDMY(currentAppointment.date)}
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span>{' '}
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              currentAppointment.status === 'Scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : currentAppointment.status === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {currentAppointment.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {currentAppointment.birthRecord && (
                      <div>
                        <h3 className="text-lg font-medium text-green-700 mb-3">
                          Patient Information
                        </h3>
                        <div className="space-y-2">
                          <p>
                            <span className="font-semibold">Mother:</span>{' '}
                            {currentAppointment.birthRecord.motherName}
                          </p>
                          {currentAppointment.birthRecord.fatherName && (
                            <p>
                              <span className="font-semibold">Father:</span>{' '}
                              {currentAppointment.birthRecord.fatherName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback Section */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-green-700">Feedback Records</h3>
                      {!showFeedbackForm && (isPediatrition || isNurse) && (
                        <button
                          onClick={() => setShowFeedbackForm(true)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                        >
                          Add Feedback
                        </button>
                      )}
                    </div>

                    {showFeedbackForm && (
                      <div className="mt-4 bg-green-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-green-700 mb-4">Add Feedback</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Baby Selection */}
                          {currentAppointment.birthRecord?.babies?.length > 0 && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Baby *
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={feedbackForm.babyId}
                                onChange={(e) =>
                                  setFeedbackForm({ ...feedbackForm, babyId: e.target.value })
                                }
                                required
                              >
                                {currentAppointment.birthRecord.babies.map((baby) => (
                                  <option key={baby.id} value={baby.id}>
                                    {baby.name || `Baby ${baby.id}`} ({baby.gender}) -{' '}
                                    {baby.birthWeight}g
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weight (g) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={feedbackForm.weight}
                              onChange={(e) =>
                                setFeedbackForm({ ...feedbackForm, weight: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status *
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={feedbackForm.status}
                              onChange={(e) =>
                                setFeedbackForm({ ...feedbackForm, status: e.target.value })
                              }
                              required
                            >
                              <option value="Healthy">Healthy</option>
                              <option value="Needs Follow-up">Needs Follow-up</option>
                              <option value="Referred">Referred</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              rows={3}
                              value={feedbackForm.feedback}
                              onChange={(e) =>
                                setFeedbackForm({ ...feedbackForm, feedback: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                          <button
                            type="button"
                            onClick={() => setShowFeedbackForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={submitFeedback}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                            disabled={
                              !feedbackForm.weight ||
                              !feedbackForm.status ||
                              !feedbackForm.babyId ||
                              isLoading
                            }
                          >
                            {isLoading ? 'Saving...' : 'Save Feedback'}
                          </button>
                        </div>
                      </div>
                    )}

                    {currentAppointment.appointmentFeedback?.length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {currentAppointment.appointmentFeedback.map((feedback, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg border border-gray-200"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <p>
                                <span className="font-semibold">Baby:</span>{' '}
                                {feedback.baby?.name || `Baby ${feedback.baby?.id}`}
                              </p>
                              <p>
                                <span className="font-semibold">Weight:</span> {feedback.weight} g
                              </p>
                              <p>
                                <span className="font-semibold">Status:</span> {feedback.status}
                              </p>

                              {feedback.feedback && (
                                <p className="md:col-span-2">
                                  <span className="font-semibold">Notes:</span> {feedback.feedback}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 text-gray-500 text-center py-4">
                        No feedback records available
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentPage;
