import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import profileService from '../services/profileService';
import toast from 'react-hot-toast';
import { formatNumberInput, parseNumberInput } from '../utils/currencyInput';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCalendar,
  HiOutlinePencil,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineKey,
} from 'react-icons/hi';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const getPhotoUrl = (photo) => {
    if (!photo) return '';
    if (photo.startsWith('http')) return photo;
    return photo;
  };

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [monthlyAllowance, setMonthlyAllowance] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Account info state
  const [accountInfo, setAccountInfo] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Load profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileService.getProfile();
        const data = res.data.data;
        setName(data.name || '');
        setEmail(data.email || '');
        setMonthlyAllowance(data.monthly_allowance ? formatNumberInput(String(Number(data.monthly_allowance))) : '');
        setAccountInfo(data);
      } catch (err) {
        toast.error('Gagal memuat data profil.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handle profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong.');
      return;
    }
    if (!email.trim()) {
      toast.error('Email tidak boleh kosong.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await profileService.updateProfile({
        name: name.trim(),
        email: email.trim(),
        monthly_allowance: parseNumberInput(monthlyAllowance) || 0,
      });
      updateUser(res.data.data);
      setAccountInfo(res.data.data);
      setProfileSaved(true);
      toast.success('Profil berhasil diperbarui! ✨');
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperbarui profil.';
      toast.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB.');
      return;
    }

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) {
      toast.error('Pilih foto terlebih dahulu.');
      return;
    }

    setPhotoUploading(true);
    try {
      const res = await profileService.uploadProfilePhoto(selectedPhoto);
      updateUser(res.data.data);
      setAccountInfo(res.data.data);
      setSelectedPhoto(null);
      setPhotoPreview('');
      toast.success('Foto profil berhasil diperbarui! 📸');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengupload foto profil.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleCancelPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview('');
  };

  // Verifikasi password saat ini
  const handleVerifyPassword = async () => {
    if (!currentPassword) {
      toast.error('Password saat ini wajib diisi.');
      return;
    }

    setVerifyLoading(true);
    try {
      await profileService.verifyPassword(currentPassword);
      setIsPasswordVerified(true);
      toast.success('Password terverifikasi.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memverifikasi password.';
      toast.error(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field password wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    setPasswordLoading(true);
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Password berhasil diubah! 🔒');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordVerified(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah password.';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const currentPhotoUrl = photoPreview || getPhotoUrl(accountInfo?.profile_photo || user?.profile_photo);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="brutal-card text-center">
          <div className="w-12 h-12 border-3 border-navy border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy/60 font-bold">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy">Profil Saya</h1>
          <p className="text-navy/50 text-sm font-medium mt-1">
            Kelola informasi akun dan keamanan Anda
          </p>
        </div>
      </div>

      {/* Profile Card - Header with Avatar */}
      <div className="brutal-card overflow-hidden !p-0">
        <div className="bg-primary border-b-3 border-navy p-6 md:p-8 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-secondary border-3 border-navy rounded-full opacity-30 -rotate-12" />
          <div className="absolute bottom-2 right-20 w-10 h-10 bg-income border-2 border-navy rotate-45 opacity-20" />
          <div className="absolute top-8 right-32 w-6 h-6 bg-warning border-2 border-navy rounded-full opacity-40" />
          
          <div className="relative flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar */}
            <label className="relative group cursor-pointer" title="Klik logo untuk ganti foto profil">
              <div className="w-24 h-24 rounded-brutal border-3 border-navy bg-secondary flex items-center justify-center shadow-brutal-lg select-none overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-brutal group-hover:bg-warning">
                {currentPhotoUrl ? (
                  <img src={currentPhotoUrl} alt="Foto profil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-navy">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
                <div className="absolute inset-0 rounded-brutal bg-navy/0 group-hover:bg-navy/25 flex items-center justify-center transition-all duration-200">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-extrabold text-center px-2 transition-opacity">
                    Ganti Foto
                  </span>
                </div>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
            </label>
            {/* User info */}
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-white/70 font-medium text-sm mt-1">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border-2 border-white/30 rounded-full text-xs font-bold text-white backdrop-blur-sm">
                  <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                  Akun Terverifikasi
                </span>
                {accountInfo?.created_at && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border-2 border-white/20 rounded-full text-xs font-bold text-white/80">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    Sejak {formatDate(accountInfo.created_at)}
                  </span>
                )}
              </div>

              {selectedPhoto && (
                <div className="mt-4 p-3 rounded-brutal border-2 border-white/40 bg-white/15 backdrop-blur-sm animate-slide-up">
                  <p className="text-xs font-bold text-white mb-2">
                    Preview: {selectedPhoto.name} ({(selectedPhoto.size / 1024).toFixed(0)} KB)
                  </p>
                  <div className="flex flex-col xs:flex-row gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleCancelPhoto}
                      disabled={photoUploading}
                      className="px-3 py-2 rounded-brutal border-2 border-white/40 bg-white/10 text-white text-xs font-bold hover:bg-white/20 disabled:opacity-50 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadPhoto}
                      disabled={photoUploading}
                      className="px-3 py-2 rounded-brutal border-2 border-navy bg-secondary text-navy text-xs font-extrabold shadow-brutal-sm hover:bg-warning disabled:opacity-50 transition-all"
                    >
                      {photoUploading ? '⏳ Upload...' : '📸 Simpan Foto'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Profile Form */}
        <div className="brutal-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-brutal border-3 border-navy bg-primary flex items-center justify-center shadow-brutal-sm">
              <HiOutlinePencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">Edit Profil</h3>
              <p className="text-xs text-navy/40 font-medium">Perbarui informasi pribadi Anda</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-sm font-bold text-navy mb-2">
                <HiOutlineUser className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-brutal"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-navy mb-2">
                <HiOutlineMail className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-brutal"
                placeholder="Masukkan email"
              />
            </div>

            {/* Uang Bulanan */}
            <div>
              <label className="block text-sm font-bold text-navy mb-2">
                <HiOutlineCurrencyDollar className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                Uang Bulanan
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-navy/40">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthlyAllowance}
                  onChange={(e) => setMonthlyAllowance(formatNumberInput(e.target.value))}
                  className="input-brutal !pl-12"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className={`w-full mt-2 ${profileSaved ? 'btn-brutal-income' : 'btn-brutal'} flex items-center justify-center gap-2`}
            >
              {profileLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : profileSaved ? (
                <>
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <HiOutlinePencil className="w-5 h-5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="brutal-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-brutal border-3 border-navy bg-expense flex items-center justify-center shadow-brutal-sm">
              <HiOutlineKey className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">Ubah Password</h3>
              <p className="text-xs text-navy/40 font-medium">Jaga keamanan akun Anda</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-bold text-navy mb-2">
                <HiOutlineLockClosed className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                Password Saat Ini
              </label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setIsPasswordVerified(false);
                    }}
                    disabled={isPasswordVerified}
                    className={`input-brutal !pr-12 ${isPasswordVerified ? 'bg-cream/50 text-navy/50 border-navy/30' : ''}`}
                    placeholder="Masukkan password saat ini"
                  />
                  {!isPasswordVerified && (
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-navy/40 hover:text-navy transition-colors"
                    >
                      {showCurrentPassword ? (
                        <HiOutlineEyeOff className="w-5 h-5" />
                      ) : (
                        <HiOutlineEye className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  {isPasswordVerified && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-income">
                      <HiOutlineCheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {!isPasswordVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyPassword}
                    disabled={verifyLoading || !currentPassword}
                    className="btn-brutal px-4 py-2 flex items-center justify-center min-w-[110px]"
                  >
                    {verifyLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Verifikasi'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* New Password & Confirm Password (Hanya muncul jika sudah verifikasi) */}
            {isPasswordVerified && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-slide-up">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">
                    <HiOutlineLockClosed className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-brutal !pr-12"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-navy/40 hover:text-navy transition-colors"
                    >
                      {showNewPassword ? (
                        <HiOutlineEyeOff className="w-5 h-5" />
                      ) : (
                        <HiOutlineEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {/* Info minimal karakter */}
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-expense font-bold mt-2">
                      Password minimal 6 karakter ({newPassword.length}/6)
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">
                    <HiOutlineLockClosed className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`input-brutal !pr-12 ${
                        confirmPassword && confirmPassword !== newPassword
                          ? '!border-expense !shadow-brutal-expense'
                          : confirmPassword && confirmPassword === newPassword
                          ? '!border-income !shadow-brutal-income'
                          : ''
                      }`}
                      placeholder="Ulangi password baru"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-navy/40 hover:text-navy transition-colors"
                    >
                      {showConfirmPassword ? (
                        <HiOutlineEyeOff className="w-5 h-5" />
                      ) : (
                        <HiOutlineEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-expense font-bold mt-1">Password tidak cocok!</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-xs text-income font-bold mt-1 flex items-center gap-1">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Password cocok
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="w-full mt-2 btn-brutal-expense flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengubah...
                    </>
                  ) : (
                    <>
                      <HiOutlineLockClosed className="w-5 h-5" />
                      Ubah Password
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Account Security Info */}
      <div className="brutal-card-sm bg-cream/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-navy bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
            <HiOutlineShieldCheck className="w-4 h-4 text-navy" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy">Tips Keamanan Akun</h4>
            <ul className="text-xs text-navy/50 font-medium mt-1.5 space-y-1">
              <li>• Gunakan password minimal 6 karakter</li>
              <li>• Jangan bagikan password Anda kepada siapa pun</li>
              <li>• Ubah password secara berkala untuk menjaga keamanan akun</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
