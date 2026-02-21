import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

function Admin() {
  const [fests, setFests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fests'); // 'fests' or 'users'
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFests();
    fetchUsers();
  }, []);

  const fetchFests = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'fests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const festsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched fests data:', festsData);
      setFests(festsData);
    } catch (err) {
      console.error('Error fetching fests:', err);
      setError('Failed to load fests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const handleApproveFest = async (festId) => {
    try {
      await updateDoc(doc(db, 'fests', festId), {
        status: 'published'
      });
      setFests(fests.map(fest => 
        fest.id === festId ? { ...fest, status: 'published' } : fest
      ));
      alert('Fest approved successfully!');
    } catch (err) {
      console.error('Error approving fest:', err);
      alert('Failed to approve fest');
    }
  };

  const handleRejectFest = async (festId) => {
    try {
      await updateDoc(doc(db, 'fests', festId), {
        status: 'rejected'
      });
      setFests(fests.map(fest => 
        fest.id === festId ? { ...fest, status: 'rejected' } : fest
      ));
      alert('Fest rejected');
    } catch (err) {
      console.error('Error rejecting fest:', err);
      alert('Failed to reject fest');
    }
  };

  const handleDeleteFest = async (festId) => {
    if (!confirm('Are you sure you want to delete this fest? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'fests', festId));
      setFests(fests.filter(fest => fest.id !== festId));
      alert('Fest deleted successfully');
    } catch (err) {
      console.error('Error deleting fest:', err);
      alert('Failed to delete fest');
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'organizer': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'student': return 'bg-green-100 text-green-800 border border-green-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔐 Admin Panel</h1>
          <p className="mt-2 text-gray-600">Manage fests and users on the platform</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('fests')}
              className={`${
                activeTab === 'fests'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              🎪 Manage Fests ({fests.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              👥 Manage Users ({users.length})
            </button>
          </nav>
        </div>

        {/* Fests Tab */}
        {activeTab === 'fests' && (
          <div className="space-y-4">
            {fests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No fests found</p>
              </div>
            ) : (
              fests.map((fest) => (
                <div
                  key={fest.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{fest.festName || 'Unnamed Fest'}</h3>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                              fest.status
                            )}`}
                          >
                            {fest.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-base font-semibold text-gray-700">
                          🏫 {fest.collegeName || 'College not specified'}
                        </p>
                        {fest.organizerName && (
                          <p className="text-sm text-gray-500">
                            👤 Organizer: {fest.organizerName}
                          </p>
                        )}
                        <p className="text-gray-600 leading-relaxed">
                          {fest.description || 'No description provided'}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">📅 Date:</span> 
                          {fest.date ? new Date(fest.date).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'Not set'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">📍 Location:</span> 
                          {fest.location || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">💰 Fee:</span> 
                          ₹{fest.registrationFee || '0'}
                        </span>
                        {fest.createdAt && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">🕒 Created:</span> 
                            {new Date(fest.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {fest.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveFest(fest.id)}
                            className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRejectFest(fest.id)}
                            className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {fest.status === 'rejected' && (
                        <button
                          onClick={() => handleApproveFest(fest.id)}
                          className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {fest.status === 'published' && (
                        <button
                          onClick={() => handleRejectFest(fest.id)}
                          className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm"
                        >
                          ✗ Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteFest(fest.id)}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auth Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role || 'none'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.authProvider || 'email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={user.role || ''}
                        onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">No Role</option>
                        <option value="student">Student</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
