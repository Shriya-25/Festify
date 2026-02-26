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

  return (
    <div className="card p-0 group cursor-pointer hover:transform hover:-translate-y-2 transition-all duration-300">
      {/* Image Section */}
      <div className="relative overflow-hidden rounded-t-2xl h-40 sm:h-48">
        {fest.bannerUrl ? (
          <>
            <img
              src={fest.bannerUrl}
              alt={fest.festName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/50 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange-900/20 flex items-center justify-center">
            <span className="text-4xl text-white/40">🎭</span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <span className={`badge text-xs sm:text-sm ${getCategoryBadge(fest.category)}`}>
            {fest.category}
          </span>
        </div>

        {/* Status Badge */}
        {status && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
            <span className={`${status.class} text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg`}>
              {status.label}
            </span>
          </div>
        )}
      </div>

      {/* Content Section - White Card Effect */}
      <div className="relative bg-white/10 backdrop-blur-sm rounded-b-2xl p-4 sm:p-6 border-t border-white/10">
        {/* Fest Name */}
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-1">
          {fest.festName}
        </h3>

        {/* College Name */}
        <p className="text-gray-300 text-xs sm:text-sm mb-3 font-medium line-clamp-1">
          {fest.collegeName}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{fest.city || 'City TBA'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{fest.festStartDate ? new Date(fest.festStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2 leading-relaxed">
          {fest.description}
        </p>

        {/* View Details Button */}
        <Link
          to={`/fest/${fest.id}`}
          className="block w-full text-center bg-primary hover:bg-orange-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-full transition-all duration-200 hover:shadow-glow"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default FestCard;
