import { useState } from 'react';
import profileService from '../../services/profileService';
import toast from 'react-hot-toast';
import { HiOutlineX } from 'react-icons/hi';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(Math.round(Number(value) || 0));

const WelcomeModal = ({ isOpen, onClose, onComplete }) => {
  const [allowance, setAllowance] = useState('');
  const [saving, setSaving] = useState(false);

  const presets = [500000, 1000000, 1500000, 2000000, 3000000, 5000000];

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!allowance || Number(allowance) <= 0) {
      toast.error('Masukkan nominal uang bulanan');
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile({ monthly_allowance: Number(allowance) });
      toast.success('Uang bulanan disimpan! 💰');
      onComplete?.();
      onClose?.();
    } catch (err) {
      toast.error('Gagal menyimpan uang bulanan');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border-3 border-navy rounded-brutal shadow-brutal animate-pop">

        <button onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-brutal border-2 border-transparent text-navy/30 hover:text-navy hover:border-navy/20 hover:bg-cream transition-all">
          <HiOutlineX className="w-5 h-5" />
        </button>

        <div className="p-6 animate-slide-up">
          <div className="text-center mb-6">
            <span className="text-4xl block mb-3">👋</span>
            <h2 className="text-xl font-bold text-navy">Selamat Datang!</h2>
            <p className="text-navy/40 text-sm font-medium mt-2">
              Atur uang bulananmu agar DuitKu bisa menghitung sisa saldo dengan akurat.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-navy mb-2">💵 Uang Bulanan Kamu</label>
              <input
                type="number"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="input-brutal text-xl font-bold text-center"
                placeholder="Rp 0"
                min="1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAllowance(String(preset))}
                  className={`py-2 px-3 rounded-brutal border-2 text-xs font-bold transition-all ${
                    Number(allowance) === preset
                      ? 'bg-primary text-white border-navy shadow-brutal-sm'
                      : 'border-navy/10 text-navy/50 hover:border-navy/30 hover:bg-cream'
                  }`}
                >
                  {formatRp(preset)}
                </button>
              ))}
            </div>

            {allowance && Number(allowance) > 0 && (
              <p className="text-center text-sm font-bold text-income">
                Uang bulanan: {formatRp(allowance)}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !allowance || Number(allowance) <= 0}
              className="btn-brutal w-full text-center disabled:opacity-50"
            >
              {saving ? '⏳ Menyimpan...' : '💬 Mulai Kelola Keuangan'}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-xs font-bold text-navy/30 hover:text-navy/50 transition-colors py-2"
            >
              Isi nanti di Profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;