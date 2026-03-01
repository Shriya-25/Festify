import React from 'react';
import { Link } from 'react-router-dom';

const FestCard = ({ fest }) => {
  // Map category to badge style
  const getCategoryBadge = (category) => {
    const badges = {
      'Technical': 'badge-tech',
      'Cultural': 'badge-culture',
      'Sports': 'badge-sports'
    };
    return badges[category] || 'badge-tech';
  };

  // Get fest status
  const getFestStatus = () => {
    if (!fest.registrationStartDate || !fest.registrationEndDate) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const regStart = new Date(fest.registrationStartDate);
    regStart.setHours(0, 0, 0, 0);
    const regEnd = new Date(fest.registrationEndDate);
    regEnd.setHours(0, 0, 0, 0);
    
    if (today < regStart) {
      return { label: 'Opening Soon', class: 'bg-blue-500/90' };
    } else if (today >= regStart && today <= regEnd) {
      return { label: 'Live Now', class: 'bg-green-500/90' };
    } else {
      return { label: 'Closed', class: 'bg-gray-500/90' };
    }
  };

  const status = getFestStatus();
  const badgeClass = getCategoryBadge(fest.category);

  return (
    <div className="glass-card group flex flex-col h-full relative overflow-hidden">
      {/* Image Section */}
      <div className="relative h-[220px] overflow-hidden">
        {fest.bannerUrl ? (
          <img
            src={fest.bannerUrl}
            alt={fest.festName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center">
             <span className="text-5xl opacity-20">🎉</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1F] via-transparent to-transparent opacity-80"></div>

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
            {status && (
                <span className={`${status.class} text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md bg-opacity-90`}>
                {status.label}
                </span>
            )}
        </div>

        <div className="absolute top-4 right-4">
             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${badgeClass} text-white`}>
                {fest.category}
             </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow relative">
        {/* Background Glow Effect on Hover */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-b-2xl"></div>

        <div className="relative z-10 flex flex-col h-full">
            {/* Title & Organization */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors duration-300">
                {fest.festName}
                </h3>
                <p className="text-sm text-text-secondary font-medium line-clamp-1">
                {fest.collegeName}
                </p>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{fest.city || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="truncate">
                        {fest.festStartDate ? new Date(fest.festStartDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'TBA'}
                    </span>
                </div>
            </div>

            {/* CTA Button */}
            <div className="mt-auto pt-4 border-t border-white/5">
                <Link to={`/fest/${fest.id}`} className="block w-full">
                    <button className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 bg-white/5 hover:bg-primary hover:text-white text-white border border-white/10 hover:border-primary group-hover:shadow-glow-tech">
                        View Details
                    </button>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FestCard;
