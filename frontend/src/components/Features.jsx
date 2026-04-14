import React from 'react';

const Features = () => {
  const features = [
    {
      title: 'Digital Invitation Management',
      desc: 'Seamlessly generate and deliver digital invitations to thousands of graduates simultaneously.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Intelligent Seating Allocation',
      desc: 'Advanced logic automatically ranks seating based on academic hierarchy and performance.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: 'QR Code-Based Attendance',
      desc: 'High-speed entry tracking via secure QR scans for graduates, guests, and VIPs.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
    },
    {
      title: 'Real-Time Gate Monitoring',
      desc: 'Separate gate management for VIPs and standard attendees with live dashboard reporting.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <section id="features" className="bg-slate-50 dark:bg-slate-950 py-32 px-6 md:px-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 max-w-3xl mx-auto space-y-6">
          <h4 className="inline-block bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            Capabilities
          </h4>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            Digital Transformation <br/> <span className="text-primary-600 dark:text-primary-500 italic">for Big Moments.</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg lg:text-xl tracking-wide max-w-2xl mx-auto">
            Everything you need to orchestrate a world-class graduation ceremony from a single, unified hub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {features.map((f, i) => (
            <div key={i} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-primary-500/30 dark:hover:border-primary-400/30 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-start relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 -mr-10 -mt-10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-colors duration-500"></div>
              
              <div className="text-primary-600 dark:text-primary-400 mb-8 transform group-hover:scale-110 transition-transform duration-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative z-10">
                {f.icon}
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight relative z-10">
                {f.title}
                <div className="w-10 h-1 bg-primary-500 dark:bg-primary-600 mt-4 rounded-full group-hover:w-full transition-all duration-300"></div>
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base leading-relaxed font-medium relative z-10 mt-2">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
