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
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [formData, setFormData] = useState({});

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

  const openRegistrationModal = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if email is verified for email/password users
    if (!currentUser.emailVerified && currentUser.providerData[0]?.providerId === 'password') {
      setMessage('Please verify your email before registering for fests');
      setTimeout(() => navigate('/verify-email'), 2000);
      return;
    }

    if (userRole !== 'student') {
      setMessage('Only students can register for fests');
      return;
    }

    // Fetch user data for prefill
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();

    // Initialize form with prefilled data or empty values
    const initialFormData = {};
    
    if (fest.prefillUserData) {
      initialFormData.name = userData?.name || currentUser.displayName || '';
      initialFormData.email = userData?.email || currentUser.email || '';
      initialFormData.phone = userData?.phone || '';
      initialFormData.college = userData?.college || '';
    }

    // Initialize custom fields with empty values
    if (fest.registrationForm && fest.registrationForm.length > 0) {
      fest.registrationForm.forEach(field => {
        initialFormData[field.id] = field.type === 'checkbox' ? false : '';
      });
    }

    setFormData(initialFormData);
    setShowRegistrationModal(true);
    setMessage('');
  };

  const handleFormChange = (e, fieldId) => {
    const { type, value, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [fieldId]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [fieldId]: files[0] });
    } else {
      setFormData({ ...formData, [fieldId]: value });
    }
  };

  const validateForm = () => {
    // Validate basic fields if prefill is enabled
    if (fest.prefillUserData) {
      if (!formData.name || !formData.email || !formData.phone || !formData.college) {
        setMessage('Please fill in all required basic fields');
        return false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setMessage('Please enter a valid email address');
        return false;
      }

      // Phone validation (basic)
      const phoneRegex = /^[0-9]{10,}$/;
      if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
        setMessage('Please enter a valid phone number (at least 10 digits)');
        return false;
      }
    }

    // Validate custom fields
    if (fest.registrationForm && fest.registrationForm.length > 0) {
      for (const field of fest.registrationForm) {
        if (field.required && !formData[field.id]) {
          setMessage(`Please fill in the required field: ${field.label}`);
          return false;
        }

        // Email field validation
        if (field.type === 'email' && formData[field.id]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData[field.id])) {
            setMessage(`Please enter a valid email for: ${field.label}`);
            return false;
          }
        }

        // Phone field validation
        if (field.type === 'phone' && formData[field.id]) {
          const phoneRegex = /^[0-9]{10,}$/;
          if (!phoneRegex.test(formData[field.id].replace(/[^0-9]/g, ''))) {
            setMessage(`Please enter a valid phone number for: ${field.label}`);
            return false;
          }
        }

        // File validation
        if (field.type === 'file' && formData[field.id]) {
          const file = formData[field.id];
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessage(`File size for ${field.label} should be less than 5MB`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setRegistering(true);
      setMessage('');

      // Prepare registration data
      const registrationData = {
        festId: id,
        userId: currentUser.uid,
        festName: fest.festName,
        collegeName: fest.collegeName,
        registeredAt: new Date().toISOString()
      };

      // Add basic fields if prefill is enabled
      if (fest.prefillUserData) {
        registrationData.name = formData.name;
        registrationData.email = formData.email;
        registrationData.phone = formData.phone;
        registrationData.college = formData.college;
      }

      // Add custom field responses
      if (fest.registrationForm && fest.registrationForm.length > 0) {
        const customResponses = {};
        fest.registrationForm.forEach(field => {
          if (field.type === 'file' && formData[field.id]) {
            // For file uploads, store file name (in production, upload to storage)
            customResponses[field.label] = formData[field.id].name;
          } else {
            customResponses[field.label] = formData[field.id] || '';
          }
        });
        registrationData.customFields = customResponses;
      }

      await addDoc(collection(db, 'registrations'), registrationData);
      
      setIsRegistered(true);
      setShowRegistrationModal(false);
      setMessage('🎉 Successfully registered for the fest!');
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
              <span className="font-semibold mr-2">📍 Venue:</span>
              <span>{fest.venue || fest.location || 'Not specified'}</span>
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
              message.includes('Success') || message.includes('🎉') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                onClick={openRegistrationModal}
                className="btn-primary w-full"
              >
                Register for this Fest
              </button>
            ) : (
              <div className="text-center text-gray-600">
                Only students can register for fests
              </div>
            )}
          </div>
        </div>

        {/* Registration Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Registration Form - {fest.festName}
                </h2>
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitRegistration} className="p-6 space-y-4">
                {/* Basic Fields (if prefill enabled) */}
                {fest.prefillUserData && (
                  <div className="space-y-4 pb-4 border-b">
                    <h3 className="font-semibold text-gray-700">Basic Information</h3>
                    
                    <div>
                      <label className="label">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleFormChange(e, 'name')}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleFormChange(e, 'email')}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleFormChange(e, 'phone')}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">
                        College Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.college || ''}
                        onChange={(e) => handleFormChange(e, 'college')}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                {fest.registrationForm && fest.registrationForm.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Additional Information</h3>
                    
                    {fest.registrationForm.map((field) => (
                      <div key={field.id}>
                        <label className="label">
                          {field.label}
                          {field.required && <span className="text-red-500"> *</span>}
                        </label>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'email' && (
                          <input
                            type="email"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'phone' && (
                          <input
                            type="tel"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            rows="4"
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'dropdown' && (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          >
                            <option value="">Select an option</option>
                            {field.options.map((option, idx) => (
                              <option key={idx} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {field.options.map((option, idx) => (
                              <label key={idx} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`field-${field.id}`}
                                  value={option}
                                  checked={formData[field.id] === option}
                                  onChange={(e) => handleFormChange(e, field.id)}
                                  required={field.required}
                                  className="w-4 h-4"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {field.type === 'checkbox' && (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData[field.id] || false}
                              onChange={(e) => handleFormChange(e, field.id)}
                              required={field.required}
                              className="w-4 h-4"
                            />
                            <span>{field.placeholder || 'I agree'}</span>
                          </label>
                        )}

                        {field.type === 'file' && (
                          <input
                            type="file"
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex space-x-4">
                  <button
                    type="submit"
                    disabled={registering}
                    className="btn-primary flex-1"
                  >
                    {registering ? 'Submitting...' : 'Submit Registration'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegistrationModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
