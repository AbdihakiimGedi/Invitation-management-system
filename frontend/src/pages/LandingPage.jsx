import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Features from '../components/Features';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans selection:bg-primary-200 selection:text-primary-900 transition-colors duration-500">
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
