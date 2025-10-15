import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModernLayout from '../components/ModernLayout';
import { createClient } from '@supabase/supabase-js';
import { checkSession } from '../lib/simpleAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Bookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check authentication via shared session
    const session = checkSession();
    if (!session) {
      router.push('/login');
      return;
    }

    fetchBookings();
  }, [router, statusFilter]);

  useEffect(() => {
    // Realtime subscription for bookings
    const channel = supabase
      .channel('bookings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  useEffect(() => {
    // Polling fallback every 10s
    const id = setInterval(() => fetchBookings(), 10000);
    return () => clearInterval(id);
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to load bookings');
      setBookings(json?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.error || 'Update failed');

      // Refresh bookings
      fetchBookings();
      alert('Booking status updated successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update booking status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Robust search filter: when searchTerm is empty, show all
  const normalizedTerm = (searchTerm || '').trim().toLowerCase();
  const filteredBookings = bookings.filter(booking => {
    if (!normalizedTerm) return true;
    const full = (booking.full_name || '').toLowerCase();
    const service = (booking.service_title || '').toLowerCase();
    const phone = String(booking.phone || '');
    return full.includes(normalizedTerm) || service.includes(normalizedTerm) || phone.includes(normalizedTerm);
  });

  // Export bookings to CSV
  const exportBookingsToCSV = () => {
    const rows = bookings || [];
    if (!rows.length) {
      alert('No bookings to export');
      return;
    }
    const headers = [
      'id','full_name','phone','email','whatsapp_number','service_title','service_price','status','created_at','updated_at'
    ];
    const escape = (val) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };
    const csv = [headers.join(',')]
      .concat(rows.map(b => headers.map(h => escape(b[h])).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const BookingModal = ({ booking, onClose, onStatusUpdate }) => {
    const [newStatus, setNewStatus] = useState(booking.status);

    const handleStatusUpdate = () => {
      onStatusUpdate(booking.id, newStatus);
      onClose();
    };

    const downloadFile = async (filePath) => {
      try {
        const res = await fetch(`/api/admin/storage/booking-file?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) {
          console.error('Error downloading file');
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const files = booking.files ? JSON.parse(booking.files) : [];

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center modal-backdrop p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 modal-content animate-bounce-in">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Service Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Service Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-medium">{booking.service_title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-medium">{booking.service_price}</p>
                </div>
                {booking.provider_name && (
                  <div>
                    <p className="text-sm text-gray-600">Provider</p>
                    <p className="font-medium">{booking.provider_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Cart Items (if this is a cart booking) */}
            {booking.cart_items && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Cart Items</h3>
                <div className="space-y-2">
                  {JSON.parse(booking.cart_items).map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600">Provider: {item.provider_name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₹{(item.price_min || 0).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">per item</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{booking.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{booking.phone}</p>
                </div>
                {booking.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{booking.email}</p>
                  </div>
                )}
                {booking.whatsapp_number && (
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp</p>
                    <p className="font-medium">{booking.whatsapp_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Project Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Requirements</p>
                  <p className="font-medium whitespace-pre-wrap">{booking.requirements}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.budget_range && (
                    <div>
                      <p className="text-sm text-gray-600">Budget Range</p>
                      <p className="font-medium">{booking.budget_range}</p>
                    </div>
                  )}
                  {booking.delivery_preference && (
                    <div>
                      <p className="text-sm text-gray-600">Timeline</p>
                      <p className="font-medium">{booking.delivery_preference}</p>
                    </div>
                  )}
                </div>
                {booking.additional_notes && (
                  <div>
                    <p className="text-sm text-gray-600">Additional Notes</p>
                    <p className="font-medium whitespace-pre-wrap">{booking.additional_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Files */}
            {files.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Uploaded Files</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm">{file.name}</span>
                      <button
                        onClick={() => downloadFile(file.path)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Update Status</h3>
              <div className="flex items-center gap-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>

            {/* Booking Info */}
            <div className="text-sm text-gray-500">
              <p>Booking ID: {booking.id}</p>
              <p>Created: {formatDate(booking.created_at)}</p>
              {booking.updated_at !== booking.created_at && (
                <p>Updated: {formatDate(booking.updated_at)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ModernLayout user={{ email: 'admin@taliyo.com' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bookings Management</h1>
            <p className="text-gray-600 mt-1">Manage customer bookings and orders</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={exportBookingsToCSV} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map(status => {
            const count = bookings.filter(b => b.status === status).length;
            const colors = {
              pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
              'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
              completed: 'bg-green-100 text-green-800 border-green-200',
              cancelled: 'bg-red-100 text-red-800 border-red-200'
            };
            return (
              <button
                type="button"
                onClick={() => setStatusFilter(status)}
                key={status}
                className={`text-left w-full rounded-xl p-4 border transition-shadow ${colors[status]} ${statusFilter === status ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                title={`Show ${status.replace('-', ' ')}`}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm font-medium capitalize">{status.replace('-', ' ')}</div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, service, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm mr-3">
                            {booking.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {booking.service_title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.service_price}
                        </div>
                        {booking.cart_items && (
                          <div className="text-xs text-blue-600 mt-1">
                            Cart Order ({JSON.parse(booking.cart_items).length} items)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={updateBookingStatus}
        />
      )}
    </ModernLayout>
  );
}