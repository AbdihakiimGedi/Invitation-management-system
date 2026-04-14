import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-20 px-6 md:px-12 text-white overflow-hidden relative transition-colors duration-500">
      {/* Decorative accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 border-b border-gray-800 pb-20">
          
          <div className="col-span-1 md:col-span-2 space-y-8 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase">
               Digital <span className="text-primary-500 font-medium tracking-normal italic">Ceremony</span>
            </h2>
            <p className="text-gray-400 max-w-sm text-lg leading-relaxed mx-auto md:mx-0 font-medium">
              Pioneering digital excellence in academic commencements. 
              Built for reliability, security, and scale.
            </p>
          </div>

          <div className="space-y-6 text-center md:text-left">
             <h4 className="text-primary-500 font-bold uppercase tracking-widest text-xs">Resources</h4>
             <ul className="space-y-4 text-gray-400 font-medium">
                <li><a href="#" className="hover:text-primary-400 transition-colors duration-300">Integration Guide</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors duration-300">API Docs</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors duration-300">Support Center</a></li>
             </ul>
          </div>

          <div className="space-y-6 text-center md:text-left">
             <h4 className="text-primary-500 font-bold uppercase tracking-widest text-xs">Company</h4>
             <ul className="space-y-4 text-gray-400 font-medium">
                <li><a href="#about" className="hover:text-primary-400 transition-colors duration-300">About Us</a></li>
                <li><a href="#contact" className="hover:text-primary-400 transition-colors duration-300">Contact</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors duration-300">Terms of Service</a></li>
             </ul>
          </div>

        </div>

        <div className="flex flex-col justify-center items-center text-center">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
            &copy; {new Date().getFullYear()} Digital Invitation & Attendance Management. Managed by University IT.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
