import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ComplaintCard from "../components/ComplaintCard.jsx";
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

const sortFieldOptions = [
  { label: "Priority score", value: "priorityScore" },
  { label: "Newest first", value: "createdAt" },
];

const sortDirOptions = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
];

const AdminComplaintsPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    priorityLevel: "",
    sortBy: "priorityScore",
    sortDirection: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(filters.q, 400);

  const fetchComplaints = useCallback(
    async (page = meta.page) => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          page,
          limit: 12,
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
        };

        if (filters.status) params.status = filters.status;
        if (filters.priorityLevel) params.priorityLevel = filters.priorityLevel;
        if (debouncedQuery) params.q = debouncedQuery;

        const { data } = await api.get("/admin/complaints", { params });
        setComplaints(data.data.items || []);
        setMeta({
          page: data.data.page || 1,
          totalPages: data.data.totalPages || 1,
          total: data.data.total || 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load complaints");
      } finally {
        setLoading(false);
      }
    },
    [
      api,
      debouncedQuery,
      filters.priorityLevel,
      filters.sortBy,
      filters.sortDirection,
      filters.status,
      meta.page,
    ],
  );

  useEffect(() => {
    fetchComplaints(1);
    
    // Live update listeners
    if (user?._id) {
      socket.emit("join_user_room", user._id, user.role);
    }

    const handleCreated = () => {
      // Refresh current page to see new items properly ranked/paginated
      fetchComplaints();
    };

    const handleUpdated = (updatedComplaint) => {
      // Optimistically update the card in place. 
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
    setFilters({
      q: "",
      status: "",
      priorityLevel: "",
      sortBy: "priorityScore",
      sortDirection: "desc",
    });
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchComplaints(1);
    }, 0);

    return () => clearTimeout(handle);
  }, [
    filters.priorityLevel,
    filters.sortBy,
    filters.sortDirection,
    filters.status,
    debouncedQuery,
    fetchComplaints,
  ]);

  const updateStatus = async (complaintId, status) => {
    try {
      setLoading(true);
      await api.patch(`/admin/complaints/${complaintId}`, { status });
      await fetchComplaints(meta.page);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(
    () =>
      complaints.map((complaint) => {
        const actions = [];
        
        actions.push({
          key: "details",
          element: (
            <button
               onClick={() => navigate(`/complaints/${complaint._id}`)}
               className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
             >
               View details
             </button>
          )
        });

        if (complaint.status === "submitted") {
          actions.push({
            key: "start",
            element: (
              <button
                onClick={() => updateStatus(complaint._id, "in_progress")}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm focus:outline-none"
              >
                Mark in progress
              </button>
            ),
          });
        }

        if (complaint.status !== "resolved") {
          actions.push({
            key: "resolve",
            element: (
              <button
                onClick={() => updateStatus(complaint._id, "resolved")}
                className="w-full sm:w-auto px-4 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg transition-colors shadow-sm focus:outline-none"
              >
                Mark resolved
              </button>
            ),
          });
        }

        return (
          <ComplaintCard
            key={complaint._id}
            complaint={complaint}
            actions={actions}
          />
        );
      }),
    [complaints, navigate, updateStatus],
  );

  return (
    <div className="flex flex-col space-y-6 md:space-y-8 animate-fade-in">
      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 animate-fade-in-up">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                City-wide complaints
              </h1>
              <p className="text-sm text-slate-500">
                Filter by status, priority, and sort. Results are <strong className="text-teal-600">AI-ranked</strong> when searching.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="text-sm px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 shadow-sm whitespace-nowrap"
            >
              Reset filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-12">
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
                  placeholder="Intelligent search by natural language, title, description, or location"
                />
              </div>
            </div>

            <div className="md:col-span-6 lg:col-span-3">
              <label htmlFor="status" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 border p-2.5 bg-white transition-colors"
              >
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-6 lg:col-span-3">
              <label htmlFor="priorityLevel" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
              <select
                id="priorityLevel"
                name="priorityLevel"
                value={filters.priorityLevel}
                onChange={handleFilterChange}
                className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 border p-2.5 bg-white transition-colors"
              >
                {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="md:col-span-6 lg:col-span-3">
              <label htmlFor="sortBy" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sort by</label>
              <select
                id="sortBy"
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 border p-2.5 bg-white transition-colors"
              >
                {sortFieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="md:col-span-6 lg:col-span-3">
              <label htmlFor="sortDirection" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Order</label>
              <select
                id="sortDirection"
                name="sortDirection"
                value={filters.sortDirection}
                onChange={handleFilterChange}
                className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 border p-2.5 bg-white transition-colors"
              >
                {sortDirOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 animate-fade-in">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <svg className="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500 font-medium">Loading complaints...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-10">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center mb-4">
              <p className="font-medium">{error}</p>
            </div>
            <button 
              onClick={() => fetchComplaints(meta.page)}
              className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xl p-8 text-center text-sm font-medium">
            No complaints match the current filters. Try broadening your search.
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="space-y-4">
              {cards}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                Page <span className="text-slate-900">{meta.page}</span> of <span className="text-slate-900">{meta.totalPages}</span> · <span className="text-slate-900">{meta.total}</span> total
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  disabled={meta.page <= 1 || loading}
                  onClick={() => fetchComplaints(meta.page - 1)}
                  className="px-4 py-2 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages || loading}
                  onClick={() => fetchComplaints(meta.page + 1)}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaintsPage;
