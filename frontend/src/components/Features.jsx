import React from 'react';

const Features = () => {
  const features = [
    {
      id: '01',
      title: 'Distributed Registry',
      desc: 'Seamlessly generate and deliver secure digital credentials to thousands of graduates in near-zero latency.',
    },
    {
      id: '02',
      title: 'Neural Seating',
      desc: 'Advanced algorithms automatically organize spatial allocation based on institutional hierarchy and performance.',
    },
    {
      id: '03',
      title: 'QR Gateway',
      desc: 'High-velocity entry tracking via encrypted authentication for graduates, guests, and distinguished VIPs.',
    },
    {
      id: '04',
      title: 'Operational Hub',
      desc: 'Comprehensive gate monitoring with segmented management for maximum institutional peak efficiency.',
    }
  ];

  return (
    <section id="features" className="bg-white dark:bg-slate-900 py-32 md:py-48 px-8 md:px-12 transition-all duration-700 relative overflow-hidden">
      {/* Visual background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <div className="w-full h-full bg-grid-slate-900/[0.1] dark:bg-grid-white/[0.1]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-12">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-primary-600 font-black uppercase tracking-[0.4em] text-[9px]">Capabilities</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9]">
              Advanced <br /> 
              <span className="text-primary-600 italic">Systems.</span>
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xl max-w-md leading-relaxed">
            A comprehensive suite of protocols designed to orchestrate high-stakes 
            institutional events with absolute precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="group p-10 rounded-[3rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:bg-slate-900 dark:hover:bg-white hover:border-transparent transition-all duration-700 h-full flex flex-col">
              <div className="text-slate-200 dark:text-slate-800 group-hover:text-primary-500/50 font-black text-6xl tracking-tighter transition-colors duration-500 mb-12">
                {f.id}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-white dark:group-hover:text-slate-900 mb-6 tracking-tight uppercase">
                {f.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300 dark:group-hover:text-slate-500 text-sm leading-relaxed font-medium italic mt-auto">
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
