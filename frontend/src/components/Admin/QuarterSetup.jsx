import React, { useState, useEffect } from "react";
import quarterService from "../../services/quarterService";
import {
  Calendar,
  Plus,
  CheckCircle,
  Trash2,
  X,
  Save,
  AlertCircle,
  Star,
  Copy,
} from "lucide-react";

const QuarterSetup = () => {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copying, setCopying] = useState(false);

  const [formData, setFormData] = useState({
    name: "Q1",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  });

  const [copyData, setCopyData] = useState({
    sourceQuarterId: "",
    targetQuarterId: ""
  });

  useEffect(() => {
    loadQuarters();
  }, []);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      setQuarters(response.data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load quarters" });
    } finally {
      setLoading(false);
    }
  };

  const getQuarterDates = (quarter, year) => {
    const quarters = {
      Q1: { start: `${year}-01-01`, end: `${year}-03-31` },
      Q2: { start: `${year}-04-01`, end: `${year}-06-30` },
      Q3: { start: `${year}-07-01`, end: `${year}-09-30` },
      Q4: { start: `${year}-10-01`, end: `${year}-12-31` },
    };
    return quarters[quarter];
  };

  const handleOpenModal = () => {
    const currentYear = new Date().getFullYear();
    setFormData({
      name: "Q1",
      year: currentYear,
      start_date: `${currentYear}-01-01`,
      end_date: `${currentYear}-03-31`,
    });
    setShowModal(true);
    setMessage({ type: "", text: "" });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: "Q1",
      year: new Date().getFullYear(),
      start_date: "",
      end_date: "",
    });
  };

  const handleOpenCopyModal = (quarter) => {
    setSelectedQuarter(quarter);
    setCopyData({
      sourceQuarterId: "",
      targetQuarterId: quarter.id
    });
    setShowCopyModal(true);
    setMessage({ type: "", text: "" });
  };

  const handleCloseCopyModal = () => {
    setShowCopyModal(false);
    setSelectedQuarter(null);
    setCopyData({
      sourceQuarterId: "",
      targetQuarterId: ""
    });
  };

  const handleCopyQuarter = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!copyData.sourceQuarterId) {
      setMessage({ type: "error", text: "Please select a quarter to copy from" });
      return;
    }

    try {
      setCopying(true);

      const response = await quarterService.copyFromPreviousQuarter(
        copyData.sourceQuarterId,
        copyData.targetQuarterId
      );

      setMessage({
        type: "success",
        text: `Successfully copied ${response.data.classes_copied} classes and ${response.data.members_copied} members!`,
      });

      setTimeout(() => {
        handleCloseCopyModal();
        loadQuarters();
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to copy quarter data",
      });
    } finally {
      setCopying(false);
    }
  };

  const handleSetActive = async (quarterId) => {
    try {
      await quarterService.setActive(quarterId);
      setMessage({
        type: "success",
        text: "Active quarter updated successfully!",
      });
      loadQuarters();
    } catch {
      setMessage({ type: "error", text: "Failed to set active quarter" });
    }
  };

  const handleDelete = async (id, name, year) => {
    if (!window.confirm(`Delete ${name} ${year}? This will remove all related classes and data!`))
      return;

    try {
      await quarterService.delete(id);
      setMessage({
        type: "success",
        text: "Quarter deleted successfully",
      });
      loadQuarters();
    } catch {
      setMessage({
        type: "error",
        text: "Failed to delete quarter. It may have associated data.",
      });
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

{/* COPY CLASSES MODAL */}

{showCopyModal && selectedQuarter && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">

    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">

      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-xl font-semibold text-gray-900">
          Copy Classes & Members
        </h3>

        <button onClick={handleCloseCopyModal}>
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleCopyQuarter} className="p-6 space-y-4">

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Target Quarter:</span>{" "}
            {selectedQuarter.name} {selectedQuarter.year}
          </p>
        </div>

        <div>
          <label className="label">Copy From Quarter</label>

          <select
            value={copyData.sourceQuarterId}
            onChange={(e) =>
              setCopyData({
                ...copyData,
                sourceQuarterId: e.target.value,
              })
            }
            className="input"
            required
          >

            <option value="">Select a quarter to copy from</option>

            {quarters
              .filter(q => q.id !== selectedQuarter.id)
              .sort((a, b) => {
                // Sort by year descending, then by quarter name descending
                if (a.year !== b.year) return b.year - a.year;
                return b.name.localeCompare(a.name);
              })
              .map(q => (
                <option key={q.id} value={q.id}>
                  {q.name} {q.year}
                </option>
              ))}

          </select>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="btn-primary flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Copy Data</span>
          </button>
        </div>

      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default QuarterSetup;