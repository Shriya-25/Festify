import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const FestDetails = () => {
  const { id } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [fest, setFest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFestDetails();
    if (currentUser) {
      checkRegistrationStatus();
    }
  }, [id, currentUser]);

  const fetchFestDetails = async () => {
    try {
      const festDoc = await getDoc(doc(db, 'fests', id));
      if (festDoc.exists()) {
        setFest({ id: festDoc.id, ...festDoc.data() });
      } else {
        setMessage('Fest not found');
      }
    } catch (error) {
      console.error('Error fetching fest:', error);
      setMessage('Error loading fest details');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('festId', '==', id),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(registrationsQuery);
      setIsRegistered(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userRole !== 'student') {
      setMessage('Only students can register for fests');
      return;
    }

    try {
      setRegistering(true);
      
      // Fetch student details from users collection
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      await addDoc(collection(db, 'registrations'), {
        festId: id,
        userId: currentUser.uid,
        festName: fest.festName,
        collegeName: fest.collegeName,
        studentName: userData?.name || currentUser.displayName || 'N/A',
        studentEmail: userData?.email || currentUser.email,
        studentPhone: userData?.phone || 'Not provided',
        studentCollege: userData?.college || 'Not provided',
        registeredAt: new Date().toISOString()
      });
      setIsRegistered(true);
      setMessage('Successfully registered for the fest!');
    } catch (error) {
      console.error('Error registering:', error);
      setMessage('Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading fest details...</p>
      </div>
    );
  }

  if (!fest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Fest Not Found</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Image */}
        {fest.bannerUrl && (
          <div className="mb-8">
            <img
              src={fest.bannerUrl}
              alt={fest.festName}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Fest Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-gray-800">{fest.festName}</h1>
            <span className="px-4 py-2 bg-primary text-white rounded-full">
              {fest.category}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center text-gray-700">
              <span className="font-semibold mr-2">🏫 College:</span>
              <span>{fest.collegeName}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="font-semibold mr-2">📍 Location:</span>
              <span>{fest.location}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="font-semibold mr-2">📅 Date:</span>
              <span>{new Date(fest.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">About the Fest</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {fest.description}
            </p>
          </div>

          {/* Registration Section */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div>
            {!currentUser ? (
              <button onClick={() => navigate('/login')} className="btn-primary w-full">
                Login to Register
              </button>
            ) : isRegistered ? (
              <button disabled className="w-full bg-green-500 text-white font-semibold py-3 px-6 rounded-lg">
                ✓ Already Registered
              </button>
            ) : userRole === 'student' ? (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="btn-primary w-full"
              >
                {registering ? 'Registering...' : 'Register for this Fest'}
              </button>
            ) : (
              <div className="text-center text-gray-600">
                Only students can register for fests
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          ← Back to All Fests
        </button>
      </div>
    </div>
  );
};

export default FestDetails;
