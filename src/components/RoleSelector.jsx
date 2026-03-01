import React from 'react';

const RoleSelector = ({ selectedRole, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div 
        onClick={() => onSelect('student')}
        className={`group relative p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 ${
          selectedRole === 'student' ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,122,24,0.15)] ring-1 ring-primary' : ''
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 ${
           selectedRole === 'student' ? 'opacity-100' : 'group-hover:opacity-100'
        }`}></div>
        
        <div className="relative flex flex-col items-center text-center gap-3 z-10">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
            selectedRole === 'student' 
              ? 'bg-gradient-to-br from-primary to-orange-600 text-white shadow-lg shadow-primary/30' 
              : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
          }`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <h3 className={`font-bold text-sm transition-colors ${selectedRole === 'student' ? 'text-primary' : 'text-gray-300 group-hover:text-white'}`}>
              Student
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 leading-tight">
              Register for events & manage tickets
            </p>
          </div>
        </div>

        {selectedRole === 'student' && (
          <div className="absolute top-2 right-2 animate-fade-in">
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div 
        onClick={() => onSelect('organizer')}
        className={`group relative p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer overflow-hidden transition-all duration-300 hover:border-accent/50 hover:bg-accent/5 ${
          selectedRole === 'organizer' ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,70,24,0.15)] ring-1 ring-accent' : ''
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 transition-opacity duration-300 ${
           selectedRole === 'organizer' ? 'opacity-100' : 'group-hover:opacity-100'
        }`}></div>

        <div className="relative flex flex-col items-center text-center gap-3 z-10">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
            selectedRole === 'organizer' 
              ? 'bg-gradient-to-br from-accent to-red-600 text-white shadow-lg shadow-accent/30' 
              : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
          }`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className={`font-bold text-sm transition-colors ${selectedRole === 'organizer' ? 'text-accent' : 'text-gray-300 group-hover:text-white'}`}>
              Organizer
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 leading-tight">
              Create fests & manage attendees
            </p>
          </div>
        </div>

        {selectedRole === 'organizer' && (
          <div className="absolute top-2 right-2 animate-fade-in">
            <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
