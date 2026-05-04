import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const AdminSidebar = ({ isOpen, setIsOpen, user, handleLogout, onOpenAssignPeople }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const menuItems = [
    {
      title: 'Analytics',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      children: [
        { title: 'Overview', path: '/admin' }
      ]
    },
    {
      title: 'Events',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      children: [
        { title: 'All Events', path: '/admin/events' },
        { title: 'Assign People', onClick: onOpenAssignPeople }
      ]
    },
    {
      title: 'Directories',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      children: [
        { title: 'Graduates', path: '/admin/graduates' },
        { title: 'Guests', path: '/admin/guests' },
        { title: 'VIPs', path: '/admin/vips' }
      ]
    },
    {
      title: 'Communication',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      children: [
        { title: 'All Invitations', path: '/admin/invitations' },
        { title: 'QR Code Engine', path: '/admin/qr-codes' }
      ]
    },
    {
      title: 'Operations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      children: [
        { title: 'Manage Seat Groups', path: '/admin/seats' },
        { title: 'Assign People (Seats)', path: '/admin/assign-seats' },
        { title: 'Assigned Seat Groups', path: '/admin/assigned-seat-groups' },
        { title: 'Entry Terminal', path: '/admin/terminal' }
      ]
    }
  ];

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const parentToExpand = menuItems.find(item => 
      item.children?.some(child => child.path === currentPath)
    );
    if (parentToExpand && !expandedMenus.includes(parentToExpand.title)) {
      setExpandedMenus(prev => [...prev, parentToExpand.title]);
    }
  }, [location.pathname]);

  const toggleMenu = (title) => {
    setExpandedMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (item) => item.children?.some(child => isActive(child.path));

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header Section */}
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-10">
            <Link to="/admin" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-600/20 group-hover:scale-110 transition-transform duration-300">D</div>
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Admin<span className="text-primary-600 italic">.</span></span>
            </Link>
            
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 border border-slate-100 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              {isDarkMode ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center space-x-4">
             <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-lg shadow-sm border border-slate-100 dark:border-slate-700">
               {user?.username?.[0] || 'A'}
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.username || 'Admin User'}</h3>
               <p className="text-[10px] font-bold text-primary-600 dark:text-primary-500 uppercase tracking-widest">{user?.role || 'Superuser'}</p>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
          {menuItems.map((menu, idx) => {
            const isExpanded = expandedMenus.includes(menu.title);
            const parentActive = isParentActive(menu);

            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => toggleMenu(menu.title)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                    parentActive 
                      ? 'bg-primary-50/50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <span className={`${parentActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} transition-colors`}>
                      {menu.icon}
                    </span>
                    <span className="text-[13px] font-bold tracking-tight">
                      {menu.title}
                    </span>
                  </div>
                  <svg 
                    className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div 
                  className={`space-y-1 px-2 overflow-hidden transition-all duration-500 ease-in-out ${
                    isExpanded ? 'max-h-[500px] mt-1.5 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {menu.children.map((child, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => {
                        if (child.onClick) child.onClick();
                        else navigate(child.path);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-10 py-2.5 rounded-xl text-[12px] font-bold tracking-tight transition-all duration-200 ${
                        isActive(child.path)
                          ? 'text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{child.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 mt-auto border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-black text-[11px] uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all active:scale-95 border border-rose-100 dark:border-rose-900/20 shadow-sm shadow-rose-600/5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

