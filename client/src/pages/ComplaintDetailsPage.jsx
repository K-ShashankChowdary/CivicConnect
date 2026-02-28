import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import { socket } from "../services/socket.js";

const statusStyles = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const priorityStyles = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-sky-50 text-sky-700 border-sky-200",
  Low: "bg-slate-50 text-slate-700 border-slate-200",
};

const ComplaintDetailsPage = () => {
  const { api, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarComplaints, setSimilarComplaints] = useState([]);
  const [findingSimilar, setFindingSimilar] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        setError(null);
        // Using admin route if admin, otherwise normal relative route
        const endpoint = user?.role === 'admin' ? `/admin/complaints` : `/complaints`;
        const { data } = await api.get(`${endpoint}/${id}`);
        // The endpoints are slightly different, standard users get array of 1 from /complaints/:id?
        // Wait, normally /complaints/:id returns standard payload data.data 
        setComplaint(data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load complaint details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [api, id, user?.role]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("join_user_room", user._id, user.role);
    }
    if (id) {
      socket.emit("join_complaint", id);
    }

    const handleUpdated = (updatedComplaint) => {
      if (updatedComplaint._id === id) {
        setComplaint(prev => ({ ...prev, ...updatedComplaint }));
      }
    };

    socket.on("complaintUpdated", handleUpdated);

    return () => {
      socket.off("complaintUpdated", handleUpdated);
    };
  }, [id]);

  const handleFindSimilar = async () => {
    if (similarComplaints.length > 0) return; // already loaded
    try {
      setFindingSimilar(true);
      const { data } = await api.get(`/admin/complaints/${id}/similar`);
      setSimilarComplaints(data.data.items || []);
    } catch (err) {
      console.error(err);
      alert("Failed to find similar complaints");
    } finally {
      setFindingSimilar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center py-10">
        <svg className="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-500 font-medium">Loading details...</p>
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
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!complaint) {
    return null;
  }

  const createdDate = new Date(complaint.createdAt).toLocaleString();
  const incidentDate = complaint.incidentTime
    ? new Date(complaint.incidentTime).toLocaleString()
    : null;

  const isSlaBreached =
    complaint.status !== "resolved" &&
    new Date() - new Date(complaint.createdAt) > 48 * 60 * 60 * 1000;

  const priorityStyle = priorityStyles[complaint.priorityLevel] || priorityStyles.Low;
  const statusStyle = statusStyles[complaint.status] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm animate-fade-in-up">
        <div className="flex flex-col space-y-5">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-slate-500 hover:text-teal-600 self-start inline-flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to complaints
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {complaint.title}
          </h1>

          <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-100 pb-4">
            <CategoryChip category={complaint.category} />
            
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold capitalize border ${statusStyle}`}>
              {complaint.status.replace("_", " ")}
            </span>
            
            {isSlaBreached && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border bg-red-50 text-red-700 border-red-300 shadow-sm animate-pulse">
                SLA Breached (&gt;48h)
              </span>
            )}

            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${priorityStyle}`}>
              {complaint.priorityLevel}
            </span>
            
            {typeof complaint.priorityScore === "number" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-600">
                Score: {complaint.priorityScore.toFixed(2)}
              </span>
            )}
            
            {complaint.location && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-600 max-w-sm truncate">
                <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {complaint.location}
              </span>
            )}
            
            {incidentDate && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600">
                Incident: {incidentDate}
              </span>
            )}
          </div>

          <div className="text-sm text-slate-500 space-y-1">
            <span className="block">Reported array {createdDate}</span>
            {(typeof complaint.priorityScore === "number" || complaint.priorityReason) && (
              <span className="block italic text-slate-400">
                {complaint.priorityReason
                  ? `AI reasoning: ${complaint.priorityReason}`
                  : "Priority assigned by AI from category, description, and urgency."}
              </span>
            )}
          </div>

          <div className="pt-2">
            <h3 className="text-base font-bold text-slate-900 mb-2">Description</h3>
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleFindSimilar}
                disabled={findingSimilar}
                className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-lg transition-colors border border-indigo-200"
              >
                {findingSimilar ? 'Analyzing vectors...' : 'Find Similar Complaints (AI)'}
              </button>

              {similarComplaints.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">Similar Complaints Found:</h4>
                  <div className="flex flex-col gap-2">
                    {similarComplaints.map(sim => (
                      <div key={sim._id} className="p-3 bg-white border border-slate-200 rounded-lg text-sm flex justify-between items-center hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/complaints/${sim._id}`)}>
                        <div>
                          <p className="font-semibold text-slate-800">{sim.title}</p>
                          <p className="text-slate-500 text-xs">Score: {(sim.score || 0).toFixed(2)}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyles[sim.status] || "bg-slate-100 text-slate-600"}`}>
                          {sim.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {complaint.attachments && complaint.attachments.length > 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Attached images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {complaint.attachments.map((url) => (
              <div key={url} className="rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50 h-64">
                <img
                  src={url}
                  alt={complaint.title}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailsPage;
