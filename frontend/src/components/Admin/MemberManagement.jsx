import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import classMemberService from '../../services/classMemberService';
import { Plus, Edit2, Trash2, X, Users, Search, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

const MemberManagement = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [modalClass, setModalClass] = useState('');
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const quarterId = localStorage.getItem('selectedQuarterId') || '';
      const url = quarterId ? `/classes?quarter_id=${quarterId}` : '/classes';
      const res = await api.get(url);
      const raw = res.data;
      let list = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.data)) list = raw.data;
      setClasses(list);
      if (list.length > 0 && !selectedClass) {
        setSelectedClass(list[0].id);
        setModalClass(list[0].id);
      }
    } catch (err) {
      showToast('error', 'Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  }, [selectedClass]);

  const loadMembers = useCallback(async (classId) => {
    if (!classId) return;
    try {
      setLoadingMembers(true);
      const response = await classMemberService.getByClass(classId);
      const raw = Array.isArray(response) ? response : response?.data || [];
      setMembers(raw.filter(m => m.is_active !== false));
    } catch (err) {
      showToast('error', 'Failed to load members');
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { if (selectedClass) loadMembers(selectedClass); }, [selectedClass]);

  const openAddModal = () => {
    setEditingMember(null);
    setMemberName('');
    setModalClass(selectedClass || (classes[0]?.id ?? ''));
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setMemberName(member.member_name);
    setModalClass(member.class_id || selectedClass);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setMemberName('');
  };

  const handleSave = async () => {
    if (!memberName.trim()) {
      showToast('error', 'Please enter a member name.');
      return;
    }
    if (!modalClass) {
      showToast('error', 'Please select a class.');
      return;
    }
    try {
      setSaving(true);
      const quarterId = localStorage.getItem('selectedQuarterId') || '';

      if (editingMember) {
        await classMemberService.update(editingMember.id, { member_name: memberName.trim() });
        showToast('success', '✅ Member updated successfully!');
      } else {
        await classMemberService.create({
          class_id: modalClass,
          quarter_id: quarterId,
          member_name: memberName.trim(),
        });
        showToast('success', '✅ Member added successfully!');
      }

      closeModal();
      loadMembers(selectedClass);
      if (!editingMember && modalClass !== selectedClass) {
        setSelectedClass(modalClass);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save member';
      showToast('error', `❌ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Remove "${member.member_name}" from this class?`)) return;
    try {
      await classMemberService.delete(member.id);
      showToast('success', '✅ Member removed successfully!');
      loadMembers(selectedClass);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove member';
      showToast('error', `❌ ${msg}`);
    }
  };

  const filtered = members.filter(m =>
    m.member_name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClassName = classes.find(c => String(c.id) === String(selectedClass))?.class_name || '';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl flex items-center space-x-3 text-white text-sm font-semibold transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Member Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Add, edit or remove members from any class.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-100 transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Class selector + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Class</label>
          {loadingClasses ? (
            <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name || c.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <span className="font-bold text-slate-800">{selectedClassName}</span>
            <span className="text-xs text-slate-400 font-medium">({filtered.length} member{filtered.length !== 1 ? 's' : ''})</span>
          </div>
        </div>

        {loadingMembers ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading members...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              {search ? 'No members match your search.' : 'No members in this class yet. Click "Add Member" to get started.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((member, idx) => (
              <li key={member.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 group transition">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-300 w-6 text-right">{idx + 1}</span>
                  <span className="font-semibold text-slate-800 text-sm">{member.member_name}</span>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!editingMember && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Class
                </label>
                <select
                  value={modalClass}
                  onChange={e => setModalClass(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name || c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Member Name
              </label>
              <input
                type="text"
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Enter full name"
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Each member can only appear once per quarter across all classes.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-1">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-sm rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{saving ? 'Saving...' : editingMember ? 'Save Changes' : 'Add Member'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;