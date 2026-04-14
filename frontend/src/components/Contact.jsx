import React from 'react';

const Contact = () => {
  const contactInfo = [
    {
      label: 'Email',
      value: 'cakidaxkaiincumar43@gmail.com',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      label: 'Phone Number',
      value: '+2526139365888',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    }
  ];

  return (
    <section id="contact" className="bg-white dark:bg-slate-900 py-32 px-6 md:px-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="mb-20 space-y-6 relative z-10">
          <h4 className="inline-block bg-slate-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            Get in Touch
          </h4>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            Contact <span className="text-primary-600 dark:text-primary-500 italic">Information.</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg max-w-2xl mx-auto tracking-wide">
            Have questions about the system? Reach out to us through any of our support channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto relative z-10">
          {contactInfo.map((info, i) => (
            <div 
              key={i} 
              className="group bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-12 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-primary-500/30 dark:hover:border-primary-400/30 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center"
            >
              <div className="bg-white dark:bg-slate-900 w-24 h-24 rounded-[2rem] flex items-center justify-center text-primary-600 dark:text-primary-400 mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm border border-slate-100 dark:border-slate-800">
                {info.icon}
              </div>
              <h3 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-3">
                {info.label}
              </h3>
              <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white break-all tracking-tight selection:bg-primary-200 selection:text-primary-900">
                {info.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Contact;
