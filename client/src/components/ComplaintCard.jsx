import PropTypes from "prop-types";
import CategoryChip from "./CategoryChip.jsx";

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

const ComplaintCard = ({ complaint, actions }) => {
  const createdDate = new Date(complaint.createdAt).toLocaleString();
  const resolvedDate = complaint.resolvedAt
    ? new Date(complaint.resolvedAt).toLocaleString()
    : null;

  const descriptionPreview =
    complaint.description && complaint.description.length > 220
      ? `${complaint.description.slice(0, 220)}…`
      : complaint.description;

  const priorityStyle = priorityStyles[complaint.priorityLevel] || priorityStyles.Low;
  const statusStyle = statusStyles[complaint.status] || "bg-slate-50 text-slate-700 border-slate-200";

  // Left border color based on priority
  const borderLeftColor = 
    complaint.priorityLevel === "Critical" ? "border-l-red-500" :
    complaint.priorityLevel === "High" ? "border-l-orange-500" :
    complaint.priorityLevel === "Medium" ? "border-l-sky-500" :
    "border-l-slate-300";

  return (
    <div className={`bg-white rounded-xl border border-slate-200 sm:border-l-4 ${borderLeftColor} shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-r-teal-200 hover:border-y-teal-200 transition-all duration-200 overflow-hidden`}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          
          <div className="flex flex-row flex-wrap md:flex-col md:min-w-[140px] gap-2 md:gap-3 content-start">
            <CategoryChip category={complaint.category} />
            
            <span
              title="AI-assigned priority"
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${priorityStyle}`}
            >
              {complaint.priorityLevel}
            </span>
            
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold capitalize border ${statusStyle}`}
            >
              {complaint.status.replace("_", " ")}
            </span>

          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {complaint.title}
            </h3>

            <span className="text-xs font-medium text-slate-400 block">
              {createdDate}
            </span>

            <p className="text-sm text-slate-600 leading-relaxed mt-1">
              {descriptionPreview ?? ""}
            </p>

            <div className="flex flex-wrap gap-2 mt-2">
              {complaint.tags
                ?.filter(
                  (tag) => tag.label !== "Impact" && tag.label !== "address",
                )
                .map((tag, idx) => (
                  <span
                    key={[tag.label, tag.value].filter(Boolean).join("-") || `tag-${idx}`}
                    title={tag.label}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 max-w-[240px] truncate"
                  >
                    {tag.value}
                  </span>
                ))}
              {complaint.location && (
                <span
                  title="Location"
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 max-w-[420px] truncate"
                >
                  <svg className="w-3 h-3 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {complaint.location}
                </span>
              )}
              {complaint.incidentTime && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600">
                  Incident: {new Date(complaint.incidentTime).toLocaleString()}
                </span>
              )}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600">
                  <svg className="w-3 h-3 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {complaint.attachments.length} image{complaint.attachments.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {(resolvedDate || (actions && actions.length > 0)) && (
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
          <div className="order-2 sm:order-1">
            {resolvedDate && (
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Resolved {resolvedDate}
              </span>
            )}
          </div>
          {actions && actions.length > 0 && (
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
              {actions.map((action) => (
                <div key={action.key} className="w-full sm:w-auto">
                  {action.element}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ComplaintCard.propTypes = {
  complaint: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    location: PropTypes.string,
    category: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    priorityLevel: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ),
    attachments: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string.isRequired,
    incidentTime: PropTypes.string,
    resolvedAt: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }).isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      element: PropTypes.node.isRequired,
    }),
  ),
};

ComplaintCard.defaultProps = {
  actions: [],
};

export default ComplaintCard;
