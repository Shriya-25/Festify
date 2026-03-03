import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="p-8 mt-auto border-t border-white/5 text-center bg-surface-card/50 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span className="font-bold text-xl text-white">Festify</span>
        </div>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          The ultimate platform for campus life. Discover, register, and experience events like never before.
        </p>
        <div className="flex items-center gap-6 mt-2">
          <Link to="/about" className="text-xs font-semibold text-gray-500 hover:text-primary uppercase tracking-widest transition-colors">About</Link>
          <Link to="/contact" className="text-xs font-semibold text-gray-500 hover:text-primary uppercase tracking-widest transition-colors">Support</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
