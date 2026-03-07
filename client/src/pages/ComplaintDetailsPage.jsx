import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CategoryChip from "../components/CategoryChip.jsx";

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
  const [similarError, setSimilarError] = useState(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        setError(null);
        // Using admin route if admin, otherwise normal relative route
        const endpoint = user?.role === 'admin' ? `/admin/complaints` : `/complaints`;
        const { data } = await api.get(`${endpoint}/${id}`);
        if (data?.data == null) {
          setError("Complaint not found or invalid response.");
          return;
        }
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



  const handleFindSimilar = async () => {
    if (similarComplaints.length > 0) return; // already loaded
    setSimilarError(null);
    try {
      setFindingSimilar(true);
      const { data } = await api.get(`/admin/complaints/${id}/similar`);
      const raw = data?.data?.items ?? data?.data;
      setSimilarComplaints(Array.isArray(raw) ? raw : []);
    } catch (err) {
      setSimilarError(err.response?.data?.message || "Failed to find similar complaints. Try again.");
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

  const priorityStyle = priorityStyles[complaint.priorityLevel] || priorityStyles.Low;
  const statusStyle = statusStyles[complaint.status] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up">
        <div className="flex flex-col space-y-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-slate-500 hover:text-teal-600 self-start inline-flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to complaints
          </button>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {complaint.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-b border-slate-100 pb-6">
            <CategoryChip category={complaint.category} />
            
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold capitalize border ${statusStyle}`}>
              {complaint.status.replace("_", " ")}
            </span>
            
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
            <span className="block">Reported at {createdDate}</span>
            {complaint.priorityReason && (
              <span className="block italic text-slate-400">
                AI reasoning: {complaint.priorityReason}
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
                className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-lg transition-colors border border-indigo-200 disabled:opacity-70"
              >
                {findingSimilar ? 'Finding similar…' : 'Find Similar Complaints (AI)'}
              </button>
              {similarError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  {similarError}
                  <button type="button" onClick={() => setSimilarError(null)} className="underline">Dismiss</button>
                </p>
              )}

              {similarComplaints.length > 0 && (
                <div className="mt-6 space-y-4 animate-fade-in-up">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.75 3a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 019.75 3zm4.5 4a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0114.25 7zm-9 4a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm13.5 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm-14.7 6.45a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zm13.94 0a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    AI Suggested Similar Complaints:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {similarComplaints.map((sim, idx) => (
                      <div 
                        key={sim?._id ?? `similar-${idx}`} 
                        onClick={() => navigate(`/complaints/${sim._id}`)}
                        className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group" 
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-slate-800 line-clamp-2 pr-2 group-hover:text-indigo-700 transition-colors leading-tight">
                            {sim.title}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${statusStyles[sim.status] || "bg-slate-100 text-slate-600"}`}>
                            {sim.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                          <span className="inline-flex items-center text-indigo-600 text-xs font-bold">
                            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Score: {(sim.score ?? 0).toFixed(2)}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-slate-500 text-xs font-medium truncate">
                            {sim.category}
                          </span>
                        </div>
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
            {complaint.attachments.map((url, idx) => (
              <div key={`attachment-${idx}-${url}`} className="rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50 h-64">
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
