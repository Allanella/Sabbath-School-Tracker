import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classService from "../../services/classService";
import weeklyDataService from "../../services/WeeklyDataService";
import classMemberService from "../../services/classMemberService";
import offlineStorage from "../../utils/offlineStorage";
import {
  Save,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  DollarSign,
  WifiOff,
  RefreshCw,
} from "lucide-react";

const WeeklyDataEntry = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [weekNumber, setWeekNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [manualOffline, setManualOffline] = useState(false);

  const [members, setMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [editingMember, setEditingMember] = useState(null);

  const isDevelopment = process.env.NODE_ENV === "development";

  const [formData, setFormData] = useState({
    sabbath_date: "",
    total_attendance: 0,
    member_visits: 0,
    members_conducted_bible_studies: 0,
    members_helped_others: 0,
    members_studied_lesson: 0,
    number_of_visitors: 0,
    bible_study_guides_distributed: 0,
    offering_global_mission: 0,
    members_summary: "",
  });

  /*
  =====================================
  LOAD CLASSES ON PAGE LOAD
  =====================================
  */
  useEffect(() => {
    loadClasses();
    checkPendingMembers();
  }, []);

  /*
  =====================================
  LISTEN FOR QUARTER CHANGES
  =====================================
  */
  useEffect(() => {
    const handleQuarterChange = () => {
      loadClasses();
    };

    window.addEventListener("quarterChanged", handleQuarterChange);

    return () => {
      window.removeEventListener("quarterChanged", handleQuarterChange);
    };
  }, []);

  /*
  =====================================
  ONLINE / OFFLINE DETECTION
  =====================================
  */
  useEffect(() => {
    const updateOnlineStatus = () => {
      const actualStatus = navigator.onLine;
      const nowOnline = actualStatus && !manualOffline;

      setIsOnline(nowOnline);
    };

    const handleOnline = () => updateOnlineStatus();
    const handleOffline = () => updateOnlineStatus();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(updateOnlineStatus, 2000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [manualOffline]);

  /*
  =====================================
  LOAD MEMBERS WHEN CLASS CHANGES
  =====================================
  */
  useEffect(() => {
    if (selectedClass) {
      loadMembers();
    }
  }, [selectedClass]);

  /*
  =====================================
  LOAD CLASSES
  =====================================
  */
  const loadClasses = async () => {
    try {
      const quarterId = localStorage.getItem("selectedQuarterId");

      if (!quarterId) {
        setMessage({
          type: "error",
          text: "Please select a quarter first from the sidebar",
        });
        return;
      }

      const response = await classService.getByQuarter(quarterId);
      const classesData = response.data?.data || response.data || [];

      if (Array.isArray(classesData)) {
        setClasses(classesData);

        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        }
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error("Failed to load classes", error);
      setClasses([]);
    }
  };

  /*
  =====================================
  LOAD MEMBERS
  =====================================
  */
  const loadMembers = async () => {
    try {
      const response = await classMemberService.getByClass(selectedClass);
      const membersData = response.data?.data || response.data || [];

      if (Array.isArray(membersData)) {
        setMembers(membersData);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Failed to load members", error);
      setMembers([]);
    }
  };

  /*
  =====================================
  CHECK LOCAL OFFLINE MEMBERS
  =====================================
  */
  const checkPendingMembers = () => {
    try {
      const localMembers = JSON.parse(
        localStorage.getItem("pendingMembers") || "[]"
      );
      if (isDevelopment) {
        console.log("Pending members:", localMembers.length);
      }
    } catch (error) {
      console.error("Error checking pending members", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Weekly Data Entry</h1>

      {message.text && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <label className="block font-medium mb-1">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border rounded p-2 w-full"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.class_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default WeeklyDataEntry;