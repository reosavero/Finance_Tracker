import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlineTag,
  HiOutlineUser,
} from 'react-icons/hi';

const getPhotoUrl = (photo) => {
  if (!photo) return '';
  if (photo.startsWith('http')) return photo;
  return photo;
};

const navItems = [
  { path: '/dashboard', icon: HiOutlineHome, label: 'Dashboard', color: 'bg-primary' },
  { path: '/transactions', icon: HiOutlineClock, label: 'Riwayat', color: 'bg-lavender' },
  { path: '/categories', icon: HiOutlineTag, label: 'Kategori', color: 'bg-secondary' },
  { path: '/budget', icon: HiOutlineChartBar, label: 'Anggaran', color: 'bg-income' },
  { path: '/bills', icon: HiOutlineCreditCard, label: 'Tagihan', color: 'bg-warning' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profilePhotoUrl = getPhotoUrl(user?.profile_photo);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[260px] flex-col bg-white border-r-3 border-navy z-40">
        {/* Logo */}
        <div className="p-6 border-b-3 border-navy">
          <h1 className="text-2xl font-bold text-navy">
            Duit<span className="bg-secondary px-1.5 py-0.5 border-2 border-navy rounded-lg ml-0.5 inline-block -rotate-2">Ku</span>
          </h1>
          <p className="text-navy/40 text-xs font-medium mt-1.5">Finance Tracker 💰</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-brutal border-3 font-bold text-sm transition-all duration-150 ${
                  isActive
                    ? `${item.color} text-white border-navy shadow-brutal-sm`
                    : 'bg-transparent text-navy/60 border-transparent hover:bg-cream hover:border-navy hover:shadow-brutal-sm'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User - Clickable Profile */}
        <div className="p-4 border-t-3 border-navy">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mb-3 rounded-brutal border-3 cursor-pointer transition-all duration-150 group no-underline ${
                isActive
                  ? 'bg-primary/10 border-primary shadow-brutal-sm'
                  : 'border-transparent hover:bg-cream hover:border-navy hover:shadow-brutal-sm'
              }`
            }
          >
            <div className="w-10 h-10 rounded-brutal border-3 border-navy bg-secondary flex items-center justify-center text-navy font-bold text-lg shadow-brutal-sm group-hover:bg-primary group-hover:text-white transition-colors duration-150 overflow-hidden flex-shrink-0">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Foto profil" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-navy truncate">{user?.name}</p>
              <p className="text-xs text-navy/40 font-medium truncate">{user?.email}</p>
            </div>
            <HiOutlineUser className="w-4 h-4 text-navy/30 group-hover:text-primary transition-colors" />
          </NavLink>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-brutal border-3 border-expense text-expense font-bold text-sm transition-all hover:bg-expense hover:text-white hover:shadow-brutal-sm">
            <HiOutlineLogout className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-3 border-navy z-50">
        <div className="flex justify-around py-2 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-brutal text-xs font-bold transition-all ${
                  isActive
                    ? `${item.color} text-white border-2 border-navy shadow-brutal-sm`
                    : 'text-navy/40 border-2 border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-brutal text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white border-2 border-navy shadow-brutal-sm'
                  : 'text-navy/40 border-2 border-transparent'
              }`
            }
          >
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Foto profil" className="w-5 h-5 rounded-full border border-current object-cover" />
            ) : (
              <HiOutlineUser className="w-5 h-5" />
            )}
            Profil
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
