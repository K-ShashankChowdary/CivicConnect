import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const user = await login(form);
      
      if (user.role !== 'admin') {
        await logout();
        toast.error('Access denied. Admin credentials required.');
        return;
      }
      
      toast.success('Admin login successful');
      navigate('/admin');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Admin login failed. Please try again.';
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorList = validationErrors.map(e => e.msg).join('. ');
        toast.error(errorList);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background for Admin Area */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
      </div>

      <div className="relative z-10 max-w-md w-full animate-fade-in-up">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-slate-700 p-8 sm:p-10">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="flex items-center justify-center mb-4 text-orange-600 bg-orange-50 p-3 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Admin Portal
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Secure endpoint for municipal administration.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="admin@municipality.org"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="password">Admin Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md shadow-orange-600/20 text-base font-bold text-white bg-orange-600 hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-700/30 focus:outline-none focus:ring-4 focus:ring-orange-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating…' : 'Admin Sign in'}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-col space-y-4 text-center text-sm">
              <p className="text-slate-600">
                New admin?{' '}
                <Link to="/admin/register" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                  Register admin account
                </Link>
              </p>
              <p className="text-slate-600">
                Not an admin?{' '}
                <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-500 transition-colors">
                  Citizen login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
