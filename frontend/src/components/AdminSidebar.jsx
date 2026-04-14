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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM9 10v5M12 8v7M15 12v3" />
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
        // { title: 'Attendance Logs', path: '/admin/attendance' },
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
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Section */}
        <div className="p-8 pb-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/admin" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary-600/20">D</span>
              <span>Ceremony<span className="text-primary-600">.</span></span>
            </Link>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Toggle Theme"
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

          <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold uppercase">
              {user?.username?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-slate-900 dark:text-white font-bold text-sm truncate">
                {user?.username || 'Administrator'}
              </h2>
              <p className="text-slate-500 text-[0.7rem] font-medium truncate uppercase tracking-wider">
                {user?.role || 'System Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
          {menuItems.map((menu, idx) => {
            const isExpanded = expandedMenus.includes(menu.title);
            const parentActive = isParentActive(menu);

            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => toggleMenu(menu.title)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    parentActive 
                      ? 'text-primary-600 dark:text-primary-400 font-semibold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={parentActive ? 'text-primary-600' : 'text-slate-400'}>
                      {menu.icon}
                    </span>
                    <span className="text-sm">
                      {menu.title}
                    </span>
                  </div>
                  <svg 
                    className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div 
                  className={`space-y-1 overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-64 mt-1 opacity-100' : 'max-h-0 opacity-0'
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
                      className={`w-full flex items-center space-x-3 px-11 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                        isActive(child.path)
                          ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
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

        {/* Footer / Logout */}
        <div className="p-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all border border-slate-200 dark:border-slate-700 active:scale-95 group"
          >
            <svg className="h-4 w-4 opacity-70 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

