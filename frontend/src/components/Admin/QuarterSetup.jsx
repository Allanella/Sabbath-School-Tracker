// components/Admin/QuarterSetup.jsx
import React, { useState, useEffect } from "react";
import { Plus, X, Save, Calendar, Circle, Copy, CheckCircle, Loader } from "lucide-react";

const ENV_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "";

const RAW_BASE = ENV_URL ? `${ENV_URL}/api/quarters` : "/api/quarters";
const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");

const getQuarterDates = (quarter, year) => {
  const y = parseInt(year, 10);
  if (isNaN(y)) return { start: "", end: "" };
  switch (quarter) {
    case "Q1": return { start: `${y}-01-01`, end: `${y}-03-31` };
    case "Q2": return { start: `${y}-04-01`, end: `${y}-06-30` };
    case "Q3": return { start: `${y}-07-01`, end: `${y}-09-30` };
    case "Q4": return { start: `${y}-10-01`, end: `${y}-12-31` };
    default:   return { start: "", end: "" };
  }
};

// Suggest next quarter automatically
const getNextQuarter = (quarters) => {
  if (!quarters || quarters.length === 0) return { name: "Q1", year: new Date().getFullYear() };
  const active = quarters.find(q => q.is_active);
  const latest = active || quarters[quarters.length - 1];
  const names = ["Q1", "Q2", "Q3", "Q4"];
  const idx = names.indexOf(latest.name);
  if (idx === 3) return { name: "Q1", year: latest.year + 1 };
  return { name: names[idx + 1], year: latest.year };
};

export default function QuarterSetup() {
  const currentYear = new Date().getFullYear();
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupStep, setSetupStep] = useState(""); // shows what's happening during submit

  const [formData, setFormData] = useState({
    name: "Q1",
    year: currentYear,
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-03-31`,
    copy_from_quarter_id: "",
    set_active: true,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  useEffect(() => { fetchQuarters(); }, []);

  const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) return await res.json();
    const htmlText = await res.text();
    throw new Error(`Server returned HTML (Status ${res.status}). Verify API routing.`);
  };

  const fetchQuarters = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_BASE_URL, { headers: getAuthHeaders() });
      if (!res.ok) {
        const errData = await parseResponse(res).catch(e => ({ message: e.message }));
        throw new Error(errData.message || "Failed to fetch quarters");
      }
      const responseData = await res.json();
      const list = responseData.data || responseData;
      setQuarters(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // Step 1: Create the quarter
      setSetupStep("Creating quarter...");
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          year: formData.year,
          start_date: formData.start_date,
          end_date: formData.end_date,
        }),
      });

      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to create quarter");

      const newQuarter = data.data || data.quarter || data;
      const newQuarterId = newQuarter.id || newQuarter._id;
      let messages = [`✅ ${formData.name} ${formData.year} created`];

      // Step 2: Copy classes + members if selected
      if (formData.copy_from_quarter_id && newQuarterId) {
        setSetupStep("Copying classes and members...");
        try {
          const copyRes = await fetch(`${API_BASE_URL}/copy`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              source_quarter_id: formData.copy_from_quarter_id,
              target_quarter_id: newQuarterId,
            }),
          });
          const copyData = await parseResponse(copyRes);
          if (copyRes.ok && copyData.success) {
            messages.push(`✅ ${copyData.data?.classes_copied || 0} classes, ${copyData.data?.members_copied || 0} members copied`);
          } else {
            messages.push(`⚠️ Copy failed: ${copyData.message}`);
          }
        } catch (copyErr) {
          messages.push(`⚠️ Copy failed: ${copyErr.message}`);
        }
      }

      // Step 3: Set as active if checked
      if (formData.set_active && newQuarterId) {
        setSetupStep("Setting as active quarter...");
        try {
          const activeRes = await fetch(`${API_BASE_URL}/set-active`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ quarter_id: newQuarterId }),
          });
          const activeData = await parseResponse(activeRes);
          if (activeRes.ok) {
            messages.push("✅ Set as active quarter");
          } else {
            messages.push(`⚠️ Could not set active: ${activeData.message}`);
          }
        } catch (activeErr) {
          messages.push(`⚠️ Could not set active: ${activeErr.message}`);
        }
      }

      setSuccess(messages.join(" · "));
      await fetchQuarters();
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setSetupStep("");
    }
  };

  const handleSetActive = async (id) => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`${API_BASE_URL}/set-active`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ quarter_id: id }),
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to set active quarter");
      setSuccess("Active quarter updated successfully!");
      await fetchQuarters();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenModal = () => {
    const next = getNextQuarter(quarters);
    const dates = getQuarterDates(next.name, next.year);
    const activeQ = quarters.find(q => q.is_active);
    setFormData({
      name: next.name,
      year: next.year,
      start_date: dates.start,
      end_date: dates.end,
      copy_from_quarter_id: activeQ ? (activeQ.id || activeQ._id) : "",
      set_active: true,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "name" || name === "year") {
        const dates = getQuarterDates(updated.name, updated.year);
        if (dates.start && dates.end) {
          updated.start_date = dates.start;
          updated.end_date = dates.end;
        }
      }
      return updated;
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quarter Setup</h1>
          <p className="text-sm text-gray-500">Create quarters and carry over all classes and members automatically.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Quarter</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Quarters ({quarters.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading quarters...</div>
        ) : quarters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No quarters found. Click "New Quarter" to create one.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {quarters.map((q) => {
              const qId = q.id || q._id;
              const isActive = q.status === "active" || q.is_active;
              return (
                <li key={qId} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900">{q.name} {q.year}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {isActive ? "● Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(q.start_date)} → {formatDate(q.end_date)}</p>
                  </div>
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetActive(qId)}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center space-x-1"
                    >
                      <Circle className="h-3.5 w-3.5" />
                      <span>Set Active</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">🚀 Setup New Quarter</h3>
              <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Quarter + Year on same row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="Q1">Q1 (Jan–Mar)</option>
                    <option value="Q2">Q2 (Apr–Jun)</option>
                    <option value="Q3">Q3 (Jul–Sep)</option>
                    <option value="Q4">Q4 (Oct–Dec)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="2020"
                    max="2100"
                    required
                  />
                </div>
              </div>

              {/* Copy from */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Copy className="h-4 w-4 text-gray-500" />
                  Copy Classes & Members From
                </label>
                <select
                  name="copy_from_quarter_id"
                  value={formData.copy_from_quarter_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Start Fresh (no copy) --</option>
                  {quarters.map((q) => (
                    <option key={q.id || q._id} value={q.id || q._id}>
                      {q.name} {q.year} {q.is_active ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">All classes and members will be copied automatically.</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                </div>
              </div>

              {/* Set active checkbox */}
              <div className="flex items-center space-x-3 bg-indigo-50 px-4 py-3 rounded-lg">
                <input
                  type="checkbox"
                  id="set_active"
                  name="set_active"
                  checked={formData.set_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label htmlFor="set_active" className="text-sm font-medium text-indigo-800 cursor-pointer">
                  Set as active quarter immediately
                </label>
              </div>

              {/* Progress indicator */}
              {isSubmitting && setupStep && (
                <div className="flex items-center space-x-2 text-sm text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>{setupStep}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting
                    ? <><Loader className="h-4 w-4 animate-spin" /><span>Setting up...</span></>
                    : <><CheckCircle className="h-4 w-4" /><span>Create & Setup</span></>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}