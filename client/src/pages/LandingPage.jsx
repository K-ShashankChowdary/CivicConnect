import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "AI Priority",
      description: "Every report gets an automatic priority score so critical issues surface first.",
      icon: (
        <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      iconBg: "bg-teal-50",
    },
    {
      title: "Smart Search",
      description: "Admins find past reports instantly with semantic and keyword search.",
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      iconBg: "bg-indigo-50",
    },
    {
      title: "Live Updates",
      description: "Status changes stream in real time—no refresh needed.",
      icon: (
        <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      iconBg: "bg-slate-100",
    },
  ];

  return (
    <div className="relative min-h-[85vh] flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(248,250,252,0.95),rgb(248,250,252))]" />
        <div className="absolute top-[-20%] right-[-15%] w-[32rem] h-[32rem] rounded-full bg-teal-200/30 blur-[80px] animate-float" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[28rem] h-[28rem] rounded-full bg-indigo-200/25 blur-[80px] animate-float" style={{ animationDelay: "-4s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-slate-200/20 blur-[100px] animate-gradient-shift" />
      </div>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15] animate-slide-down">
            Report local issues.
            <br />
            <span className="text-teal-600">Get them resolved.</span>
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            CivicConnect connects you with your municipality. Submit infrastructure issues, track status, and let AI help prioritize what matters most.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {user ? (
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="w-full sm:w-auto inline-flex justify-center items-center px-7 py-3.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-soft hover:shadow-md active:scale-[0.98] transition-all duration-200 focus-ring"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-7 py-3.5 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-soft hover:shadow-glow-teal active:scale-[0.98] transition-all duration-200 focus-ring"
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-7 py-3.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-200 focus-ring"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto mt-20 sm:mt-28 text-left stagger-children">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="stagger-child bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-slate-200/60 shadow-soft hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-slate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
