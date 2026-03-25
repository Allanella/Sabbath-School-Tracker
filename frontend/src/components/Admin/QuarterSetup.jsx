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

      if (response && response.data) {
        setQuarters(response.data);
      } else {
        setQuarters([]);
      }

    } catch (error) {
      console.error("Load quarters error:", error);
      setQuarters([]);
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
        text: `Successfully copied ${response?.data?.classes_copied || 0} classes and ${response?.data?.members_copied || 0} members!`,
      });

      setTimeout(() => {
        handleCloseCopyModal();
        loadQuarters();
      }, 2000);

    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to copy quarter data",
      });
    } finally {
      setCopying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name" || name === "year") {
      const year = name === "year" ? value : formData.year;
      const qName = name === "name" ? value : formData.name;

      const dates = getQuarterDates(qName, year);

      setFormData((prev) => ({
        ...prev,
        start_date: dates.start,
        end_date: dates.end,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      await quarterService.create(formData);

      setMessage({
        type: "success",
        text: "Quarter created successfully!",
      });

      setTimeout(() => {
        handleCloseModal();
        loadQuarters();
      }, 1500);

    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to create quarter. It may already exist.",
      });
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

    } catch (error) {
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

    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to delete quarter. It may have associated data.",
      });
    }
  };

  const handleQuickCreate = async () => {
    const year = new Date().getFullYear();
    const list = ["Q1", "Q2", "Q3", "Q4"];

    try {
      for (const q of list) {
        const dates = getQuarterDates(q, year);

        await quarterService.create({
          name: q,
          year,
          start_date: dates.start,
          end_date: dates.end,
        });
      }

      setMessage({
        type: "success",
        text: `All quarters for ${year} created!`,
      });

      loadQuarters();

    } catch (error) {
      setMessage({
        type: "error",
        text: "Some quarters already existed or failed to create",
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

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quarter Management</h1>
          <p className="text-gray-600 mt-1">
            Manage Sabbath School quarters (13 weeks each)
          </p>
        </div>

        <div className="flex space-x-3">
          <button onClick={handleQuickCreate} className="btn-secondary flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Create All for {new Date().getFullYear()}</span>
          </button>

          <button onClick={handleOpenModal} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Quarter</span>
          </button>
        </div>
      </div>

      {/* QUARTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {quarters?.map((q) => (
          <div key={q.id} className="card">
            <h3 className="text-xl font-bold">{q.name} {q.year}</h3>

            <div className="flex flex-col space-y-2 mt-4">

              {!q.is_active && (
                <button
                  onClick={() => handleSetActive(q.id)}
                  className="btn-primary"
                >
                  Set Active
                </button>
              )}

              <button
                onClick={() => handleOpenCopyModal(q)}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Classes & Members</span>
              </button>

              <button
                onClick={() => handleDelete(q.id, q.name, q.year)}
                className="btn-danger flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Quarter</span>
              </button>

            </div>
          </div>
        ))}

      </div>

      {/* COPY MODAL */}
      {showCopyModal && selectedQuarter && (
        <select
          value={copyData.sourceQuarterId}
          onChange={(e) => setCopyData({ ...copyData, sourceQuarterId: e.target.value })}
          className="input"
          required
        >
          <option value="">Select a quarter to copy from</option>

          {quarters
            ?.filter(q => q.id !== selectedQuarter?.id)
            .sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.name.localeCompare(a.name);
            })
            .map(q => (
              <option key={q.id} value={q.id}>
                {q.name} {q.year}
              </option>
            ))}

        </select>
      )}

    </div>
  );
};

export default QuarterSetup;