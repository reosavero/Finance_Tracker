import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { registerOnly } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter');
    setLoading(true);
    try {
      await registerOnly(form);
      toast.success('Akun berhasil dibuat! Silakan login. 🎉');
      navigate('/login', {
        state: {
          registeredEmail: form.email,
          registeredName: form.name,
        },
        replace: true,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="fixed top-16 right-10 w-16 h-16 bg-income border-3 border-navy rounded-full hidden md:block" />
      <div className="fixed bottom-16 left-12 w-14 h-14 bg-expense border-3 border-navy rounded-brutal rotate-12 hidden md:block" />
      <div className="fixed top-1/3 left-16 w-10 h-10 bg-lavender border-3 border-navy rotate-45 hidden md:block" />

      <div className="relative w-full max-w-md animate-bounce-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-navy mb-2">
            Duit<span className="bg-secondary px-2 py-1 border-3 border-navy rounded-brutal-lg inline-block -rotate-3 shadow-brutal-sm ml-1">Ku</span>
          </h1>
          <p className="text-navy/50 font-medium mt-3">Mulai kelola keuanganmu! ✨</p>
        </div>

        <div className="brutal-card">
          <h2 className="text-xl font-bold text-navy mb-6">Buat Akun Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-navy mb-2">Nama Lengkap</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="input-brutal" placeholder="Nama kamu" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-navy mb-2">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="input-brutal" placeholder="nama@gmail.com" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-navy mb-2">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="input-brutal" placeholder="Minimal 6 karakter" required />
            </div>
            <button type="submit" disabled={loading} className="btn-brutal w-full text-center mt-2 disabled:opacity-50">
              {loading ? '⏳ Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>
          <p className="text-center text-navy/50 text-sm font-medium mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary font-bold underline decoration-2 underline-offset-2 hover:text-navy transition-colors">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;