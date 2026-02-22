import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">About Festify</h1>
          <p className="text-xl text-gray-400">
            Connecting students with amazing college events and experiences
          </p>
        </div>

        {/* Mission Section */}
        <div className="glass-container p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed">
            Festify is dedicated to creating a vibrant ecosystem where college students can discover, 
            explore, and participate in exciting campus events and festivals. We believe that college 
            life is more than just academics, it's about experiences, connections, and memories that 
            last a lifetime.
          </p>
        </div>

        {/* What We Do Section */}
        <div className="glass-container p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-primary text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-white mb-2">Discover Events</h3>
              <p className="text-gray-400">
                Browse through a wide range of technical, cultural, and sports events happening across colleges.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-primary text-4xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold text-white mb-2">Easy Registration</h3>
              <p className="text-gray-400">
                Simple and seamless registration process for all events with secure payment integration.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-primary text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect Community</h3>
              <p className="text-gray-400">
                Build connections with students from different colleges and expand your network.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="glass-container p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">Our Values</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-primary text-2xl">✓</span>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Student-First Approach</h3>
                <p className="text-gray-400">
                  Every feature we build is designed with students' needs and experiences in mind.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-primary text-2xl">✓</span>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Innovation</h3>
                <p className="text-gray-400">
                  We constantly evolve and improve to provide the best event discovery platform.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-primary text-2xl">✓</span>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Community</h3>
                <p className="text-gray-400">
                  Building strong connections between students, organizers, and institutions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="glass-container p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-400">Events Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-400">Colleges Connected</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10k+</div>
              <div className="text-gray-400">Students Engaged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
