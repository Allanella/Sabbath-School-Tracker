import React, { useState } from "react";
import { Plus, X, Save, Calendar } from "lucide-react";

// Helper function to calculate default quarter dates based on standard calendar quarters
const getQuarterDates = (quarter, year) => {
  const y = parseInt(year, 10);
  if (isNaN(y)) return { start: "", end: "" };

  switch (quarter) {
    case "Q1":
      return { start: `${y}-01-01`, end: `${y}-03-31` };
    case "Q2":
      return { start: `${y}-04-01`, end: `${y}-06-30` };
    case "Q3":
      return { start: `${y}-07-01`, end: `${y}-09-30` };
    case "Q4":
      return { start: `${y}-10-01`, end: `${y}-12-31` };
    default:
      return { start: "", end: "" };
  }
};

export default function QuarterManager() {
  const currentYear = new Date().getFullYear();

  const [quarters, setQuarters] = useState([
    {
      id: "1",
      name: "Q1",
      year: currentYear,
      start_date: `${currentYear}-01-01`,
      end_date: `${currentYear}-03-31`,
      status: "active",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "Q1",
    year: currentYear,
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-03-31`,
  });

  const handleOpenModal = () => {
    const defaultDates = getQuarterDates("Q1", currentYear);
    setFormData({
      name: "Q1",
      year: currentYear,
      start_date: defaultDates.start,
      end_date: defaultDates.end,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Fixed: Updated to batch form data changes in a single state call
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Recalculate start and end dates when name or year changes
      if (name === "name" || name === "year") {
        const dates = getQuarterDates(updated.name, updated.year);
        if (dates) {
          updated.start_date = dates.start;
          updated.end_date = dates.end;
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newQuarter = {
      id: Date.now().toString(),
      ...formData,
      status: "upcoming",
    };

    setQuarters((prev) => [...prev, newQuarter]);
    handleCloseModal();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quarter Management</h1>
          <p className="text-sm text-gray-500">
            Define fiscal quarters and track planning cycles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Quarter</span>
        </button>
      </div>

      {/* Quarters list */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Configured Quarters</h2>
        </div>

        {quarters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No quarters added yet. Click "Add Quarter" above to create one.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {quarters.map((q) => (
              <li key={q.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900">
                      {q.name} {q.year}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        q.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {q.start_date} to {q.end_date}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Quarter Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-auto overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Quarter</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quarter
                </label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="Q1">Q1 (Jan–Mar)</option>
                  <option value="Q2">Q2 (Apr–Jun)</option>
                  <option value="Q3">Q3 (Jul–Sep)</option>
                  <option value="Q4">Q4 (Oct–Dec)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="2020"
                  max="2100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Note:</p>
                <p>
                  Quarters are 13-week cycles. Dates auto-update based on your selection.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Create Quarter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}