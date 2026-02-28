import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ComplaintCard from "../components/ComplaintCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { socket } from "../services/socket.js";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

const priorityOptions = [
  { label: "All priorities", value: "" },
  { label: "Critical", value: "Critical" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

const DashboardPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    priorityLevel: "",
  });

  const debouncedQuery = useDebounce(filters.q, 400);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};

      if (filters.status) params.status = filters.status;
      if (filters.priorityLevel) params.priorityLevel = filters.priorityLevel;
      if (debouncedQuery) params.q = debouncedQuery;

      const { data } = await api.get("/complaints", { params });
      setComplaints(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [api, debouncedQuery, filters.priorityLevel, filters.status]);

  useEffect(() => {
    fetchComplaints();
    
    // Live update listeners
    if (user?._id) {
      socket.emit("join_user_room", user._id, user.role);
    }

    const handleCreated = () => {
      fetchComplaints();
    };

    const handleUpdated = (updatedComplaint) => {
      setComplaints((prev) =>
        prev.map((c) => (c._id === updatedComplaint._id ? { ...c, ...updatedComplaint } : c))
      );
    };

    socket.on("complaintCreated", handleCreated);
    socket.on("complaintUpdated", handleUpdated);

    return () => {
      socket.off("complaintCreated", handleCreated);
      socket.off("complaintUpdated", handleUpdated);
    };
  }, [fetchComplaints]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ q: "", status: "", priorityLevel: "" });
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center py-10">
        <svg className="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-500 font-medium">Loading complaints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center mb-4">
          <p className="font-medium">{error}</p>
        </div>
        <button 
          onClick={fetchComplaints}
          className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasActiveFilters = filters.q || filters.status || filters.priorityLevel;

  return (
    <div className="flex flex-col space-y-6 md:space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-teal-600/20 animate-slide-down">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              My Complaints
            </h1>
            <p className="text-teal-50 font-medium">
              Track and manage your submitted complaints
            </p>
          </div>
          <button
            onClick={() => navigate('/submit')}
            className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-3 border border-transparent shadow-sm text-sm font-bold rounded-xl text-teal-700 bg-white hover:bg-slate-50 transition-all focus:outline-none ring-1 ring-white/50"
          >
            + New Complaint
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 animate-fade-in-up">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">Filter & Search</h2>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-sm px-3 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors border border-slate-200"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-12 lg:col-span-6">
              <label htmlFor="search" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  name="q"
                  value={filters.q}
                  onChange={handleFilterChange}
                  className="pl-10 block w-full shadow-sm sm:text-sm border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 border p-2.5 transition-colors"
                  placeholder="Search by title, description, or location"
                />
              </div>
              {debouncedQuery && (
                <p className="mt-1.5 text-xs text-teal-600 font-medium">Results ranked by AI relevance</p>
              )}
            </div>

            {/* Status */}
            <div className="md:col-span-6 lg:col-span-3">
              <label htmlFor="status" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 border p-2.5 bg-white transition-colors"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="md:col-span-6 lg:col-span-3">
              <label htmlFor="priorityLevel" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
              <select
                id="priorityLevel"
                name="priorityLevel"
                value={filters.priorityLevel}
                onChange={handleFilterChange}
                className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 border p-2.5 bg-white transition-colors"
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-10 animate-fade-in">
          <svg className="animate-spin h-8 w-8 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-500 font-medium text-sm">Updating list...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-6 text-center animate-fade-in-up">
          <p className="font-medium">
            {hasActiveFilters
              ? "No complaints match your filters. Try changing or resetting them."
              : "You haven't submitted any complaints yet."}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => navigate('/submit')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Submit your first complaint
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint._id}
              complaint={complaint}
              actions={[
                {
                  key: "details",
                  element: (
                    <button
                      onClick={() => navigate(`/complaints/${complaint._id}`)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                      View details
                    </button>
                  ),
                },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
