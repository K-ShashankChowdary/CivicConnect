import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="relative flex flex-col min-h-[80vh] animate-fade-in overflow-hidden">
      {/* Premium Background Blobs */}
      <div className="absolute inset-0 z-[-1] pointer-events-none flex justify-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] sm:w-[50rem] h-[30rem] sm:h-[50rem] bg-teal-300/20 rounded-full blur-3xl transition-opacity animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] sm:w-[50rem] h-[30rem] sm:h-[50rem] bg-indigo-300/20 rounded-full blur-3xl transition-opacity animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-4xl space-y-8 animate-slide-down">
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mt-6">
            Help improve your city, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">
              one report at a time.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 font-medium leading-relaxed">
            CivicConnect is a platform to report local infrastructure issues to your municipality. We automatically assess your complaints to help municipal officers easily identify the issues that matter most.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            {user ? (
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold text-lg rounded-xl hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-slate-900/30"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-teal-600 text-white font-bold text-lg rounded-xl hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-600/30 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-teal-600/30"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold text-lg rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-slate-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto mt-24 text-left animate-fade-in-up">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-teal-100 transition-all">
              <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Priority Estimation</h3>
            <p className="text-slate-600 font-medium">When you submit an issue, our intelligent system automatically estimates a priority score from 1 to 5 to highlight critical challenges instantly.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
              <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Hybrid Search</h3>
            <p className="text-slate-600 font-medium">Administrators can find past infrastructure reports instantly using a combination of vector embeddings and the Okapi BM25 search algorithm.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-100 transition-all">
              <svg className="w-7 h-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Live Status Updates</h3>
            <p className="text-slate-600 font-medium">The dashboard connects to our Node.js server via WebSockets to show you when your complaint is marked as In Progress or Resolved without refreshing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
