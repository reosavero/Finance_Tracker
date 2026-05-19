import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil! 🎉');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      {/* Decorative shapes */}
      <div className="fixed top-10 left-10 w-20 h-20 bg-secondary border-3 border-navy rounded-full rotate-12 hidden md:block animate-float" />
      <div className="fixed bottom-20 right-16 w-16 h-16 bg-primary border-3 border-navy rounded-brutal rotate-6 hidden md:block animate-float" />
      <div className="fixed top-1/4 right-20 w-12 h-12 bg-income border-3 border-navy rotate-45 hidden md:block animate-float" />
      <div className="fixed top-24 right-[28%] w-9 h-9 bg-warning border-3 border-navy rounded-full -rotate-12 hidden lg:block opacity-90" />
      <div className="fixed bottom-28 left-[18%] w-14 h-14 bg-lavender border-3 border-navy rounded-brutal-lg rotate-12 hidden lg:block opacity-90" />
      <div className="fixed top-[58%] left-14 w-10 h-10 bg-primary border-3 border-navy rounded-full hidden md:block opacity-80" />
      <div className="fixed top-[18%] left-[30%] w-6 h-6 bg-expense border-2 border-navy rotate-45 hidden xl:block opacity-75" />
      <div className="fixed bottom-10 right-[34%] w-8 h-8 bg-secondary border-2 border-navy rounded-brutal rotate-[18deg] hidden xl:block opacity-80" />
      <div className="fixed top-[38%] left-[12%] w-7 h-7 bg-warning border-2 border-navy rounded-full hidden lg:block opacity-75" />
      <div className="fixed bottom-[34%] right-[12%] w-11 h-11 bg-expense border-3 border-navy rounded-brutal-lg -rotate-12 hidden lg:block opacity-80" />

      <div className="relative w-full max-w-md animate-bounce-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-navy mb-2">
            Duit<span className="bg-secondary px-2 py-1 border-3 border-navy rounded-brutal-lg inline-block -rotate-3 shadow-brutal-sm ml-1">Ku</span>
          </h1>
          <p className="text-navy/50 font-medium mt-3">Kelola keuangan harianmu 💸</p>
        </div>

        {/* Form Card */}
        <div className="brutal-card">
          <h2 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
            Masuk ke Akun
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-navy mb-2">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-brutal" placeholder="nama@gmail.com" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-navy mb-2">Password</label>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-brutal" placeholder="••••••••" required />
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="btn-brutal w-full text-center mt-2 disabled:opacity-50">
              {loading ? '⏳ Memproses...' : 'Masuk'}
            </button>
          </form>
          <p className="text-center text-navy/50 text-sm font-medium mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary font-bold underline decoration-2 underline-offset-2 hover:text-navy transition-colors">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
