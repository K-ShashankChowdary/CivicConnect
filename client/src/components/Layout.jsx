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
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link
              to="/"
              className="font-display text-xl sm:text-2xl font-bold text-slate-900 hover:text-teal-600 transition-colors tracking-tight"
            >
              CivicConnect
            </Link>

            <div className="relative" ref={menuRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-600 text-white font-semibold text-sm border-2 border-white/20 shadow-soft hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    title={user.name || 'User menu'}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                  >
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] py-1.5 animate-scale-in origin-top-right"
                      role="menu"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 font-medium transition-colors"
                        role="menuitem"
                      >
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/submit');
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 font-medium transition-colors"
                        role="menuitem"
                      >
                        Submit complaint
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                        role="menuitem"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200/80 transition-colors duration-200"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-white/60 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} CivicConnect
          </p>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-400">Report local issues. Get them resolved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
