import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Package, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
 
  // Force redirection to Dashboard (/) after login as per user request
  const from = '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white/10 backdrop-blur-2xl rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Left Side - Branding */}
        <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent">
          <div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20">
              <Package className="text-indigo-600" size={28} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-5 tracking-tight leading-tight">
              Manage Shared Items <span className="text-indigo-400">Securely</span>.
            </h1>
            <p className="text-indigo-100/70 text-lg max-w-md font-medium leading-relaxed">
              The premium platform for tracking, borrowing, and returning shared assets with intelligent automation and military-grade security.
            </p>
          </div>
          
          <div className="mt-16 lg:mt-24 flex items-center gap-3 text-indigo-400/80 text-sm font-bold uppercase tracking-widest">
            <ShieldCheck size={18} /> End-to-end encrypted Access
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:w-1/2 p-10 lg:p-14 bg-white flex flex-col justify-center relative">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 mb-8 font-medium">Sign in to your account to continue.</p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl rounded-l-sm animate-in fade-in zoom-in-95 duration-300">
                <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                   <ShieldCheck className="shrink-0" size={16} /> {error}
                </p>
              </div>
            )}

            <form className="space-y-5" onSubmit={submitHandler}>
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">Email address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-bold text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-bold text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] uppercase tracking-wider"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
