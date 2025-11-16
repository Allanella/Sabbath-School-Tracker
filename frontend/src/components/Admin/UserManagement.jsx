// src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'viewer'
      });
    }
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'viewer'
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const submitData = { ...formData };
      
      // Only include password if it's provided (for new users or password change)
      if (!submitData.password && !editingUser) {
        setMessage({ type: 'error', text: 'Password is required for new users' });
        return;
      }

      if (!submitData.password) {
        delete submitData.password;
      }

      if (editingUser) {
        // Update existing user
        await api.put(`/users/${editingUser.id}`, submitData);
        setMessage({ type: 'success', text: 'User updated successfully!' });
      } else {
        // Create new user
        await api.post('/auth/register', submitData);
        setMessage({ type: 'success', text: 'User created successfully!' });
      }

      setTimeout(() => {
        handleCloseModal();
        loadUsers();
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save user' 
      });
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}`, { is_active: !currentStatus });
      setMessage({ 
        type: 'success', 
        text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
      loadUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const handleDelete = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setMessage({ type: 'success', text: 'User deleted successfully' });
      loadUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'secretary':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their access levels</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>{message.text}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className="text-blue-600 hover:text-blue-900"
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message.text && (
                <div className={`p-3 rounded-lg flex items-start text-sm ${
                  message.type === 'success' ? 'bg-green-50 text-green-800' :
                  'bg-red-50 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                  )}
                  {message.text}
                </div>
              )}

              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="label">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder={editingUser ? 'Enter new password to change' : 'Enter password'}
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="viewer">Viewer</option>
                  <option value="secretary">Secretary</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === 'admin' && 'Full access to all features'}
                  {formData.role === 'secretary' && 'Can enter and view class data'}
                  {formData.role === 'viewer' && 'Can only view reports'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>{editingUser ? 'Update User' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;