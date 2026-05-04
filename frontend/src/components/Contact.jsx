import React from 'react';

const Contact = () => {
  const contactInfo = [
    {
      label: 'Technical Uplink',
      value: 'support@ceremony.digital',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      label: 'Direct Protocol Line',
      value: '+252 61 393 658 88',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    }
  ];

  return (
    <section id="contact" className="bg-slate-50 dark:bg-slate-950 py-32 md:py-48 px-8 md:px-12 transition-all duration-700 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-primary-600 font-black uppercase tracking-[0.4em] text-[9px]">Uplink</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9]">
              Secure <br/> 
              <span className="text-primary-600 italic">Support.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xl leading-relaxed max-w-lg">
              Have questions regarding system integration or institutional onboarding? 
              Our specialists are ready to maintain your operational continuity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {contactInfo.map((info, i) => (
              <div 
                key={i} 
                className="group p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 flex items-center space-x-10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="bg-slate-50 dark:bg-slate-950 w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 relative z-10">
                  {info.icon}
                </div>
                <div className="relative z-10">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-2 italic">
                    {info.label}
                  </h3>
                  <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white break-all tracking-tighter uppercase">
                    {info.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Structural bottom decor */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
    </section>
  );
};

export default Contact;
