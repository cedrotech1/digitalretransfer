import { useState, useEffect } from 'react';
import { Search, Printer, ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import * as XLSX from 'xlsx';

export default function BornRecordsReport() {
  const [bornRecords, setBornRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  const API_BASE_URL = import.meta.env.VITE_API_KEY;
  const token = Cookies.get('token');

  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  };

  const fetchBornRecords = async () => {
    try {
      setIsLoading(true);
      let url = `${API_BASE_URL}/borns/report/generated`;

      if (fromDate && toDate) {
        const formattedFromDate = formatDateForAPI(fromDate);
        const formattedToDate = formatDateForAPI(toDate);
        url += `?fromDate=${formattedFromDate}&toDate=${formattedToDate}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBornRecords(response.data.bornRecords || []);
      setSummary(response.data.summary || {});
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching born records:', error);
      alert(error.response?.data?.message || 'Failed to load born records');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const exportToExcel = () => {
    const exportData = bornRecords.map((record) => ({
      'Date of Birth': formatDisplayDate(record.dateOfBirth),
      'Health Center': record.healthCenter,
      'Mother Name': record.motherName,
      'Delivery Type': record.deliveryType,
      Leave: record.leave,
      'Baby Name': record.babies[0]?.babyName || 'N/A',
      Gender: record.babies[0]?.gender || 'N/A',
      'Birth Weight': record.babies[0]?.birthWeight || 'N/A',
      Medications: record.babies[0]?.medications?.join(', ') || 'N/A',
      'Last Appointment': formatDisplayDate(record.appointments[0]?.appointmentDate),
      Status: record.appointments[0]?.feedback[0]?.status || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Born Records');
    XLSX.writeFile(wb, `born_records_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = bornRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(bornRecords.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  useEffect(() => {
    fetchBornRecords();
  }, []);

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
  const SummaryCardSkeleton = () => (
    <div className="bg-gray-100 p-4 rounded-lg shadow animate-pulse">
      <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
      <div className="h-8 w-1/2 bg-gray-300 rounded"></div>
    </div>
  );

  const TableRowSkeleton = () => (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-600">Born Records Report</h1>
        <p className="text-gray-600">View and analyze birth records</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="relative w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          <button
            onClick={fetchBornRecords}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors self-end"
            disabled={isLoading}
          >
            <Search size={18} />
            Filter
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            disabled={isLoading || bornRecords.length === 0}
          >
            <Download size={18} />
            Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 hidden hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            disabled={isLoading || bornRecords.length === 0}
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-green-800">Total Births</h3>
              <p className="text-2xl font-bold text-green-600">{summary.totalBirths || 0}</p>
            </div>

            {summary.birthsByDeliveryType &&
              Object.entries(summary.birthsByDeliveryType).map(([type, count]) => (
                <div key={type} className="bg-blue-50 p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-blue-800">{type} Births</h3>
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                </div>
              ))}
          </>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Health Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Mother
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Delivery Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Baby Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Last Appointment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => <TableRowSkeleton key={`skeleton-${index}`} />)
              ) : currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record.bornId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateToDMY(record.dateOfBirth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.healthCenter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.motherName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.deliveryType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.babies.map((baby) => (
                        <div key={baby.babyName}>
                          <p>
                            <strong>Name:</strong> {baby.babyName}
                          </p>
                          <p>
                            <strong>Gender:</strong> {baby.gender}
                          </p>
                          <p>
                            <strong>Weight:</strong> {baby.birthWeight}g
                          </p>
                          <p>
                            <strong>Medications:</strong> {baby.medications?.join(', ') || 'None'}
                          </p>
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.appointments.length > 0
                        ? record.appointments[0].feedback.map((feedback, idx) => (
                            <div key={idx}>
                              <p>
                                <strong>Date:</strong>{' '}
                                {formatDateToDMY(record.appointments[0].appointmentDate)}
                              </p>
                              <p>
                                <strong>Status:</strong> {feedback.status}
                              </p>
                            </div>
                          ))
                        : 'No appointments'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && bornRecords.length > recordsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastRecord, bornRecords.length)}</span>{' '}
              of <span className="font-medium">{bornRecords.length}</span> records
            </div>
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft size={20} />
              </button>

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
    </div>
  );
}
