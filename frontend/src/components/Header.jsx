import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const navLinks = [
    { name: 'Concept', href: '#about' },
    { name: 'Protocol', href: '#features' },
    { name: 'Gateway', href: '#contact' },
  ];

  const handleNavClick = (href) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'h-20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/50 shadow-premium' 
        : 'h-24 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto h-full px-8 md:px-12 flex items-center justify-between">
        {/* Brand */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 bg-slate-900 dark:bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xl group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
            D
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Ceremony</span>
            <span className="text-[9px] font-black text-primary-600 uppercase tracking-[0.4em] italic">Digital.</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-10 lg:space-x-16">
          <div className="flex items-center space-x-10 lg:space-x-14">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className="text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-[0.25em] transition-all relative group py-2"
              >
                {link.name}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-600 transition-all duration-500 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-6 pl-10 border-l border-slate-100 dark:border-slate-800">
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-primary-600 transition-all border border-slate-100 dark:border-slate-800 active:scale-90"
            >
              {isDark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white transition-all active:scale-95 border border-transparent"
            >
              Portal Access
            </button>
          </div>
        </nav>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center space-x-4">
           <button 
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500"
            >
              {isDark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleMenu}
              className="p-3 rounded-2xl bg-slate-900 text-white active:scale-90 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16"} />
              </svg>
            </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] transition-all duration-700 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      >
        <div
          className={`absolute top-0 right-0 h-full w-[85%] bg-white dark:bg-slate-900 shadow-2xl p-10 transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-900 dark:bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-lg uppercase leading-none">D</div>
                <span className="text-lg font-black tracking-tighter uppercase dark:text-white leading-none">Ceremony</span>
              </div>
              <button onClick={toggleMenu} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="w-full text-left p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white transition-all active:scale-[0.98]"
                >
                  {link.name}
                </button>
              ))}
            </nav>

            <div className="mt-auto">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/login');
                }}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-900/10 active:scale-95"
              >
                Launch Portal Access
              </button>
              <p className="mt-8 text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.6em] italic opacity-50">Secure Deployment v9.0</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
