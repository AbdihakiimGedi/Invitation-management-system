import React from 'react';

const About = () => {
  return (
    <section id="about" className="bg-white dark:bg-slate-900 py-32 px-6 md:px-12 flex flex-col items-center transition-colors duration-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        
        <div className="relative group">
           <div className="absolute -inset-4 bg-primary-100/60 dark:bg-primary-900/10 rounded-[2.5rem] blur-2xl group-hover:bg-primary-200/60 dark:group-hover:bg-primary-800/20 transition duration-1000"></div>
           <div className="relative bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-10 md:p-12 rounded-[2.5rem] shadow-xl overflow-hidden backdrop-blur-sm transition-colors duration-500">
             <div className="absolute -top-10 -right-10 p-8 opacity-5 dark:opacity-10 transform rotate-12 transition-transform duration-700 group-hover:rotate-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[250px] w-[250px] text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
             </div>
             
             <div className="space-y-8 relative z-10">
               <h3 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                 Elevating the <br /> <span className="text-primary-600 dark:text-primary-400 italic">Graduation Standard.</span>
               </h3>
               <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium text-lg">
                 We believe that the final moment of academic achievement deserves a 
                 commemoration free of logistical worries. Our platform bridges the 
                 gap between traditional ceremony and digital innovation.
               </p>
               <div className="pt-6 flex items-center space-x-4 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-sm">
                 <span className="w-16 h-[3px] bg-primary-600 dark:bg-primary-400 rounded-full"></span>
                 <span>Our Vision</span>
               </div>
             </div>
           </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-6">
             <h4 className="text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest text-xs">Empowering Institutions</h4>
             <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight transition-colors duration-500">
               Built for Scale and <span className="text-primary-500 italic">Security.</span>
             </h2>
             <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed font-medium transition-colors duration-500">
                Whether you are managing hundreds or thousands of graduates, our system 
                ensures every data point—from GPA ranking to seat row—is processed with precision.
             </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
             <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                <div className="bg-white dark:bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h5 className="font-bold text-xl text-gray-900 dark:text-white">Secure Entry</h5>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Encrypted QR code generation for every attendee.</p>
             </div>
             <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                <div className="bg-white dark:bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h5 className="font-bold text-xl text-gray-900 dark:text-white">Smart Data</h5>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Automated ranking logic using degree level and GPA.</p>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default About;
