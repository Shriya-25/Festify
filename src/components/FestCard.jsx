import React from 'react';
import { Link } from 'react-router-dom';

const FestCard = ({ fest }) => {
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
      return { label: 'Opening Soon' };
    } else if (today >= regStart && today <= regEnd) {
      return { label: 'Live Now' };
    } else {
      return { label: 'Closed' };
    }
  };

  const getCategoryColor = (category) => {
     switch(category) {
        case 'Technical': return 'text-electric-blue border-electric-blue shadow-glow-blue';
        case 'Cultural': return 'text-royal-purple border-royal-purple shadow-glow-purple';
        case 'Sports': return 'text-neon-pink border-neon-pink shadow-glow-pink';
        default: return 'text-primary border-primary shadow-glow-primary';
     }
  };

  const status = getFestStatus();
  const categoryColor = getCategoryColor(fest.category);

  return (
    <div className="bg-surface-card backdrop-blur-[16px] rounded-xl overflow-hidden border border-white/10 group transition-all hover:shadow-card-main hover:-translate-y-2 flex flex-col gap-0 p-0 min-w-[280px] h-full snap-start relative">
      <div className="h-40 overflow-hidden relative">
        {/* Status Badge */}
        {status && (
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-[0_0_10px_rgba(58,190,255,0.3)] backdrop-blur-md z-20 ${status.label === 'Live Now' ? 'bg-primary/20 border-primary/50 animate-pulse' : 'bg-surface-card/80 border-white/10'}`}>
                {status.label === 'Live Now' && <span className="w-2 h-2 bg-primary rounded-full"></span>}
                <span className={`text-[10px] font-black uppercase tracking-widest ${status.label === 'Live Now' ? 'text-primary' : 'text-text-secondary'}`}>{status.label}</span>
            </div>
        )}

        {/* Category Badge - moved to right */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full border bg-surface-card/80 backdrop-blur-md z-20 ${categoryColor}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">{fest.category}</span>
        </div>

        {fest.bannerUrl ? (
          <img
            src={fest.bannerUrl}
            alt={fest.festName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-sidebar flex items-center justify-center">
             <span className="text-4xl opacity-20">🎉</span>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-bg-base/80 to-transparent"></div>
      </div>

      <div className="p-5 space-y-2 flex flex-col flex-grow relative z-10">
        <h3 className="font-bold text-lg leading-snug text-text-primary line-clamp-2 group-hover:text-primary transition-colors">{fest.festName}</h3>
        <p className="text-sm text-text-secondary font-medium line-clamp-1 mb-1">
            {fest.collegeName}
        </p>
        
        <div className="flex items-center gap-2 text-text-secondary text-sm mt-auto">
            <span className="material-symbols-outlined text-base">location_on</span>
            <span className="truncate">{fest.city || 'TBA'}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs font-bold text-primary pt-2 border-t border-white/5 mt-2">
            <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span>{fest.festStartDate ? new Date(fest.festStartDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'TBA'}</span>
            </div>
            <div className="flex items-center gap-1">
                 <span className="material-symbols-outlined text-sm">payments</span>
                 <span>Free</span> 
            </div>
        </div>
      </div>
       {/* Link wrapper for full card click functionality */}
       <Link to={`/fest/${fest.id}`} className="absolute inset-0 z-0" aria-label={`View details for ${fest.festName}`}></Link>
    </div>
  );
};

export default FestCard;
