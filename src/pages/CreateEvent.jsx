import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const CreateEvent = () => {
  const { festId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [fest, setFest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [eventData, setEventData] = useState({
    eventName: '',
    domain: 'Technical',
    description: '',
    date: '',
    time: '',
    venue: '',
    maxParticipants: '',
    registrationDeadline: '',
    isPaid: false,
    entryFee: '',
    bannerUrl: '',
    registrationForm: [],
    prefillUserData: true
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const domains = ['Technical', 'Cultural', 'Sports', 'Literary', 'Music', 'Dance', 'Gaming', 'Other'];

  useEffect(() => {
    fetchFestDetails();
    restoreEventDataFromSession();
  }, [festId]);

  const restoreEventDataFromSession = () => {
    // Check if there's pending event data in sessionStorage
    const savedData = sessionStorage.getItem('pendingEventData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setEventData({
          eventName: parsedData.eventName || '',
          domain: parsedData.domain || 'Technical',
          description: parsedData.description || '',
          date: parsedData.date || '',
          time: parsedData.time || '',
          venue: parsedData.venue || '',
          maxParticipants: parsedData.maxParticipants || '',
          registrationDeadline: parsedData.registrationDeadline || '',
          isPaid: parsedData.isPaid || false,
          entryFee: parsedData.entryFee || '',
          bannerUrl: parsedData.bannerUrl || '',
          registrationForm: parsedData.registrationForm || [],
          prefillUserData: parsedData.prefillUserData !== false
        });
        
        // If there's a banner URL, set it as preview
        if (parsedData.bannerUrl) {
          setBannerPreview(parsedData.bannerUrl);
        }
      } catch (error) {
        console.error('Error restoring event data:', error);
      }
    }
  };

  const fetchFestDetails = async () => {
    try {
      const festDoc = await getDoc(doc(db, 'fests', festId));
      if (festDoc.exists()) {
        const festData = { id: festDoc.id, ...festDoc.data() };
        if (festData.createdBy !== currentUser.uid) {
          setMessage('You do not have permission to add events to this fest');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
        setFest(festData);
      } else {
        setMessage('Fest not found');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Error fetching fest:', error);
      setMessage('Error loading fest details');
    }
  };

  const handleChange = (e) => {
    setEventData({
      ...eventData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormUpdate = (formFields) => {
    setEventData({
      ...eventData,
      registrationForm: formFields
    });
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Banner image must be less than 5MB');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const uploadBannerToImgBB = async () => {
    if (!bannerFile) return null;

    try {
      setUploadingBanner(true);
      const formData = new FormData();
      formData.append('image', bannerFile);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        return data.data.url;
      } else {
        throw new Error('Failed to upload banner');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw error;
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!eventData.eventName || !eventData.date || !eventData.time || !eventData.venue || !eventData.description || !eventData.registrationDeadline) {
      setMessage('Please fill in all required fields');
      return;
    }

    // Validate entry fee for paid events
    if (eventData.isPaid && (!eventData.entryFee || parseFloat(eventData.entryFee) <= 0)) {
      setMessage('Please enter a valid entry fee amount for paid events');
      return;
    }

    // Validate registration deadline
    const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
    const deadlineDateTime = new Date(eventData.registrationDeadline);
    
    if (deadlineDateTime >= eventDateTime) {
      setMessage('Registration deadline must be before the event date');
      return;
    }

    // If event is paid, navigate to payment setup
    if (eventData.isPaid) {
      try {
        setLoading(true);
        setMessage('');

        // Validate fest data
        if (!fest || !fest.festName) {
          setMessage('Error: Fest information not loaded properly');
          setLoading(false);
          return;
        }

        // Upload banner if provided
        let bannerUrl = eventData.bannerUrl;
        if (bannerFile) {
          setMessage('Uploading banner...');
          bannerUrl = await uploadBannerToImgBB();
          if (!bannerUrl) {
            setMessage('Failed to upload banner. Please try again.');
            setLoading(false);
            return;
          }
        }

        // Store event data in sessionStorage and navigate to payment setup
        const eventDataWithBanner = { ...eventData, bannerUrl, festName: fest.festName };
        sessionStorage.setItem('pendingEventData', JSON.stringify(eventDataWithBanner));
        navigate(`/fest/${festId}/create-event/payment-setup`);
      } catch (error) {
        console.error('Error preparing event data:', error);
        setMessage(`Failed to proceed: ${error.message || 'Please try again.'}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // If event is free, create it directly
    try {
      setLoading(true);
      setMessage('');

      // Validate fest data
      if (!fest || !fest.festName) {
        setMessage('Error: Fest information not loaded properly');
        setLoading(false);
        return;
      }

      // Upload banner if provided
      let bannerUrl = eventData.bannerUrl;
      if (bannerFile) {
        setMessage('Uploading banner...');
        bannerUrl = await uploadBannerToImgBB();
        if (!bannerUrl) {
          setMessage('Failed to upload banner. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Clean registration form data
      const cleanedRegistrationForm = eventData.registrationForm.map(field => {
        const cleanField = {
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || ''
        };
        
        if (field.options && field.options.length > 0) {
          cleanField.options = field.options;
        }
        
        return cleanField;
      });

      const newEventData = {
        festId: festId,
        festName: fest.festName,
        eventName: eventData.eventName,
        domain: eventData.domain,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : null,
        registrationDeadline: eventData.registrationDeadline,
        isPaid: false,
        entryFee: 0,
        bannerUrl: bannerUrl || '',
        registrationForm: cleanedRegistrationForm,
        prefillUserData: eventData.prefillUserData,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        participantCount: 0,
        status: 'pending',
        adminComments: ''
      };

      console.log('Creating event with data:', newEventData);

      await addDoc(collection(db, 'events'), newEventData);

      // Clear sessionStorage after successful creation
      sessionStorage.removeItem('pendingEventData');

      setMessage('🎉 Event created successfully! It will be visible once approved by admin.');
      
      setTimeout(() => {
        navigate(`/fest/${festId}/manage`);
      }, 2000);
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error details:', error.message);
      console.error('Event data:', eventData);
      setMessage(`Failed to create event: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!fest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to={`/fest/${festId}/manage`} className="text-primary hover:underline">
            ← Back to Fest Management
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Event</h1>
          <p className="text-gray-600 mb-8">
            Add an event under <strong>{fest.festName}</strong>
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('success') || message.includes('🎉') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <label htmlFor="eventName" className="label">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                required
                className="input-field"
                placeholder="e.g., Hackathon 2026, Dance Competition"
                value={eventData.eventName}
                onChange={handleChange}
              />
            </div>

            {/* Domain */}
            <div>
              <label htmlFor="domain" className="label">
                Domain <span className="text-red-500">*</span>
              </label>
              <select
                id="domain"
                name="domain"
                className="input-field"
                value={eventData.domain}
                onChange={handleChange}
              >
                {domains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="label">
                Event Banner Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="input-field"
              />
              {bannerPreview && (
                <div className="mt-4">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Recommended size: 1200x400px (Max 5MB)
              </p>
            </div>

            {/* Entry Fee Options */}
            <div>
              <label className="label">
                Entry Fee <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="isPaid"
                    checked={!eventData.isPaid}
                    onChange={() => setEventData({...eventData, isPaid: false, entryFee: ''})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Free Event</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="isPaid"
                    checked={eventData.isPaid}
                    onChange={() => setEventData({...eventData, isPaid: true})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Paid Event</span>
                </label>
              </div>

              {/* Entry Amount - shown only for paid events */}
              {eventData.isPaid && (
                <div className="mt-4">
                  <label htmlFor="entryFee" className="label">
                    Entry Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="entryFee"
                    name="entryFee"
                    min="1"
                    step="0.01"
                    required
                    className="input-field"
                    placeholder="Enter amount in rupees"
                    value={eventData.entryFee}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="label">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="input-field"
                  value={eventData.date}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="time" className="label">
                  Event Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  className="input-field"
                  value={eventData.time}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label htmlFor="venue" className="label">
                Venue <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                required
                className="input-field"
                placeholder="e.g., Main Auditorium, Lab 101"
                value={eventData.venue}
                onChange={handleChange}
              />
            </div>

            {/* Registration Deadline */}
            <div>
              <label htmlFor="registrationDeadline" className="label">
                Registration Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="registrationDeadline"
                name="registrationDeadline"
                required
                className="input-field"
                value={eventData.registrationDeadline}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Students cannot register after this deadline
              </p>
            </div>

            {/* Max Participants */}
            <div>
              <label htmlFor="maxParticipants" className="label">
                Maximum Participants (Optional)
              </label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                min="1"
                className="input-field"
                placeholder="Leave empty for unlimited"
                value={eventData.maxParticipants}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Event Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows="4"
                className="input-field"
                placeholder="Describe the event, rules, prizes, etc."
                value={eventData.description}
                onChange={handleChange}
              />
            </div>

            {/* Prefill Toggle */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Registration Form</h3>
              <div className="mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventData.prefillUserData}
                    onChange={(e) => setEventData({...eventData, prefillUserData: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">
                    ☑ Auto-fill user profile data (Name, Email, Phone, College, Branch, Year, Gender)
                  </span>
                </label>
                <p className="text-sm text-gray-500 ml-6 mt-1">
                  When enabled, registered users' profile information will be pre-filled
                </p>
              </div>

              <FormBuilder
                fields={eventData.registrationForm}
                onUpdate={handleFormUpdate}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading || uploadingBanner}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {uploadingBanner ? 'Uploading Banner...' : loading ? (eventData.isPaid ? 'Processing...' : 'Creating Event...') : (eventData.isPaid ? '➡️ Next' : '🚀 Create Event & Submit for Approval')}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Clear sessionStorage when canceling
                  sessionStorage.removeItem('pendingEventData');
                  navigate(`/fest/${festId}/manage`);
                }}
                className="btn-secondary flex-1"
                disabled={loading || uploadingBanner}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
