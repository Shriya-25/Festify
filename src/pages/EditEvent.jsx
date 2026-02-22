import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const EditEvent = () => {
  const { eventId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [originalPaymentConfig, setOriginalPaymentConfig] = useState(null);

  const domains = ['Technical', 'Cultural', 'Sports', 'Literary', 'Music', 'Dance', 'Gaming', 'Other'];

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setInitialLoading(true);
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        
        // Check if current user is the creator
        if (data.createdBy !== currentUser.uid) {
          setMessage('You do not have permission to edit this event');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
        
        setEventData({
          eventName: data.eventName || '',
          domain: data.domain || 'Technical',
          description: data.description || '',
          date: data.date || '',
          time: data.time || '',
          venue: data.venue || '',
          maxParticipants: data.maxParticipants || '',
          registrationDeadline: data.registrationDeadline || '',
          isPaid: data.isPaid || false,
          entryFee: data.entryFee || '',
          bannerUrl: data.bannerUrl || '',
          registrationForm: data.registrationForm || [],
          prefillUserData: data.prefillUserData !== undefined ? data.prefillUserData : true
        });
        
        // Store original payment config to preserve it during updates
        if (data.paymentConfig) {
          setOriginalPaymentConfig(data.paymentConfig);
        }
        
        if (data.bannerUrl) {
          setBannerPreview(data.bannerUrl);
        }
      } else {
        setMessage('Event not found');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setMessage('Error loading event details');
    } finally {
      setInitialLoading(false);
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

    try {
      setLoading(true);
      setMessage('');

      // Upload banner if new file provided
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

      const updatedEventData = {
        eventName: eventData.eventName,
        domain: eventData.domain,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : null,
        registrationDeadline: eventData.registrationDeadline,
        isPaid: eventData.isPaid,
        entryFee: eventData.isPaid ? parseFloat(eventData.entryFee) : 0,
        bannerUrl: bannerUrl || '',
        registrationForm: cleanedRegistrationForm,
        prefillUserData: eventData.prefillUserData,
        updatedAt: new Date().toISOString(),
        status: 'pending',  // Reset to pending after edit
        adminComments: ''    // Clear previous comments
      };

      // Preserve payment config if it exists
      if (originalPaymentConfig) {
        updatedEventData.paymentConfig = originalPaymentConfig;
      }

      console.log('Updating event with data:', updatedEventData);

      await updateDoc(doc(db, 'events', eventId), updatedEventData);

      setMessage('🎉 Event updated successfully! It will be reviewed by admin again.');
      
      setTimeout(() => {
        navigate(-1); // Go back to previous page
      }, 2000);
    } catch (error) {
      console.error('Error updating event:', error);
      console.error('Error details:', error.message);
      setMessage(`Failed to update event: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <button onClick={() => navigate(-1)} className="text-primary hover:underline flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <div className="glass-container p-4 sm:p-6 md:p-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Edit Event</h1>
          <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
            <strong>{eventData.eventName}</strong>
          </p>
          <p className="text-xs sm:text-sm text-yellow-300 bg-yellow-500/20 p-3 rounded-lg mb-4 sm:mb-6 md:mb-8 border border-yellow-500/30">
            ⚠️ After editing, this event will be sent back for admin approval and marked as pending.
          </p>

          {message && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${
              message.includes('success') || message.includes('🎉') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                <div className="mt-3 sm:mt-4">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <p className="text-sm text-gray-400 mt-1">
                Recommended size: 1200x400px (Max 5MB). Leave empty to keep existing banner.
              </p>
            </div>

            {/* Entry Fee Options */}
            <div>
              <label className="label">
                Entry Fee <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 sm:space-y-3">
                <label className="flex items-start sm:items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="isPaid"
                    checked={!eventData.isPaid}
                    onChange={() => setEventData({...eventData, isPaid: false, entryFee: ''})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300 text-sm sm:text-base">Free Event</span>
                </label>
                <label className="flex items-start sm:items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="isPaid"
                    checked={eventData.isPaid}
                    onChange={() => setEventData({...eventData, isPaid: true})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300 text-sm sm:text-base">Paid Event</span>
                </label>
              </div>

              {/* Entry Amount - shown only for paid events */}
              {eventData.isPaid && (
                <div className="mt-3 sm:mt-4">
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
                  <p className="text-sm text-yellow-400 mt-1">
                    ⚠️ Note: Changing payment settings may require admin re-approval
                  </p>
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
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
              <p className="text-sm text-gray-400 mt-1">
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
            <div className="border-t border-white/10 pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Registration Form</h3>
              <div className="mb-4 sm:mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventData.prefillUserData}
                    onChange={(e) => setEventData({...eventData, prefillUserData: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300">
                    Auto-fill user profile data (Name, Email, Phone, College, Branch, Year, Gender)
                  </span>
                </label>
                <p className="text-sm text-gray-400 ml-6 mt-1">
                  When enabled, registered users' profile information will be pre-filled
                </p>
              </div>

              <FormBuilder
                fields={eventData.registrationForm}
                onUpdate={handleFormUpdate}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading || uploadingBanner}
                className="btn-primary flex-1 disabled:opacity-50 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                {uploadingBanner ? 'Uploading Banner...' : loading ? 'Updating...' : 'Update Event & Resubmit for Approval'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
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

export default EditEvent;
