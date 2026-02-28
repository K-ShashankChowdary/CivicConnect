import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-gradient-to-r from-teal-600 to-teal-500 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-white text-xl font-bold tracking-wide hover:opacity-90 flex items-center transition-opacity">
              CivicConnect
            </Link>

            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-600 text-white font-bold border-2 border-white/30 hover:border-white/60 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600 transform hover:scale-105 active:scale-95"
                title={user?.name || 'User menu'}
              >
                {user?.name?.[0]?.toUpperCase() || '?'}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] bg-white ring-1 ring-black/5 divide-y divide-slate-100 py-1 overflow-hidden origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3">
                    <p className="text-sm border-b border-gray-200 pb-2">Signed in as <br/><span className="font-semibold text-gray-900">{user?.name}</span></p>
                  </div>
                  <button
                    onClick={() => {
                      navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 font-medium transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate('/submit');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 font-medium transition-colors"
                  >
                    Submit Complaint
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} CivicConnect · AI-powered priority & search
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
