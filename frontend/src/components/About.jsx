import React from 'react';

const About = () => {
  return (
    <section id="about" className="bg-slate-50 dark:bg-slate-950 py-32 md:py-48 px-8 md:px-12 transition-all duration-700 relative overflow-hidden">
      {/* Structural Decor */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32 items-center">
          
          {/* Visual Side */}
          <div className="relative group animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-600/20 to-indigo-600/0 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 md:p-16 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/[0.02] to-transparent"></div>
              
              <div className="space-y-10 relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.8rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                
                <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter uppercase">
                  Digital <br /> 
                  <span className="text-primary-600 italic">Tradition.</span>
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-lg">
                  We believe institutional milestones deserve a flawless digital canvas. 
                  Our architecture neutralizes operational risk, ensuring every 
                  moment is preserved with absolute integrity.
                </p>

                <div className="pt-6 flex items-center space-x-6">
                  <div className="h-0.5 w-16 bg-slate-900 dark:bg-white"></div>
                  <span className="text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px] italic">EST. PROTOCOL 2024</span>
                </div>
              </div>

              {/* Immersive background glyph */}
              <div className="absolute -bottom-10 -right-10 opacity-[0.02] dark:opacity-[0.05] pointer-events-none transform rotate-12 group-hover:scale-110 transition-transform duration-1000">
                <svg className="h-80 w-80 text-slate-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Narrative Side */}
          <div className="space-y-16 animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="space-y-8">
               <div className="flex items-center space-x-4">
                  <div className="w-8 h-px bg-primary-600"></div>
                  <h4 className="text-primary-600 font-black uppercase tracking-[0.5em] text-[10px]">The core philosophy</h4>
               </div>
               <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter uppercase">
                 Scale without <br />
                 <span className="text-slate-300 dark:text-slate-700 italic font-light">Variables.</span>
               </h2>
               <p className="text-slate-500 dark:text-slate-400 text-xl leading-relaxed font-medium max-w-xl">
                  Engineered to orchestrate high-density human experiences with 
                  the precision of a digital heartbeat.
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
               <div className="group space-y-6">
                  <div className="text-slate-900 dark:text-white font-black text-3xl tracking-tighter uppercase leading-none flex items-center space-x-4">
                    <span>01</span>
                    <div className="h-px w-10 bg-slate-100 dark:bg-slate-800 group-hover:w-20 transition-all duration-500"></div>
                  </div>
                  <div>
                    <h5 className="font-black text-[11px] text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-3">Encrypted Access</h5>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed italic">
                      Zero-trust entry protocols utilizing high-entropy QR authentication.
                    </p>
                  </div>
               </div>
               <div className="group space-y-6">
                  <div className="text-slate-900 dark:text-white font-black text-3xl tracking-tighter uppercase leading-none flex items-center space-x-4">
                    <span>02</span>
                    <div className="h-px w-10 bg-slate-100 dark:bg-slate-800 group-hover:w-20 transition-all duration-500"></div>
                  </div>
                  <div>
                    <h5 className="font-black text-[11px] text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-3">Live Synthesis</h5>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed italic">
                      Real-time gate telemetry synchronized across all operational nodes.
                    </p>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
