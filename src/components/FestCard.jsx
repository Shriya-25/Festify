import React from 'react';
import { Link } from 'react-router-dom';

const FestCard = ({ fest }) => {
  return (
    <div className="card">
      {fest.bannerUrl && (
        <img
          src={fest.bannerUrl}
          alt={fest.festName}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800">{fest.festName}</h3>
        <span className="px-3 py-1 bg-primary text-white text-xs rounded-full">
          {fest.category}
        </span>
      </div>
      <p className="text-gray-600 mb-2">{fest.collegeName}</p>
      <p className="text-sm text-gray-500 mb-2">📍 {fest.venue || fest.location || 'Venue TBA'}</p>
      <p className="text-sm text-gray-500 mb-4">📅 {new Date(fest.date).toLocaleDateString()}</p>
      <p className="text-gray-700 mb-4 line-clamp-2">{fest.description}</p>
      <Link
        to={`/fest/${fest.id}`}
        className="btn-primary w-full text-center block"
      >
        View Details
      </Link>
    </div>
  );
};

export default FestCard;
