import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const UserRegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-teal-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
      </div>

      <div className="relative z-10 max-w-md w-full animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/50 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Create Account
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Join CivicConnect to report and track municipal issues
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-slate-500">Use 6 or more characters.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="12, MG Road, Bangalore"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="+91 9876543210"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md shadow-teal-600/20 tracking-wide text-base font-bold text-white bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 focus:outline-none focus:ring-4 focus:ring-slate-900/10 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-col space-y-4 text-center text-sm">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-500 transition-colors">
                  Sign in
                </Link>
              </p>
              <p className="text-slate-600">
                Are you an admin?{' '}
                <Link to="/admin/register" className="font-semibold text-teal-600 hover:text-teal-500 transition-colors">
                  Admin registration
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegisterPage;
