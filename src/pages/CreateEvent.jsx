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
  const [currentStep, setCurrentStep] = useState(1);
  
  const [eventData, setEventData] = useState({
    eventName: '',
    domain: 'Technical',
    description: '',
    rules: '',
    date: '',
    time: '',
    venue: '',
    googleMapsLink: '',
    maxParticipants: '',
    registrationDeadline: '',
    isPaid: false,
    entryFee: '',
    enableCoupon: false,
    couponCode: '',
    discountPercent: '',
    couponExpiry: '',
    maxCouponUsage: '',
    bannerUrl: '',
    contacts: [],
    guests: [],
    registrationForm: [],
    prefillUserData: true
  });

  // States for contact management
  const [currentContact, setCurrentContact] = useState({ name: '', phone: '', email: '', description: '' });

  // States for guest management
  const [currentGuest, setCurrentGuest] = useState({ 
    name: '', 
    photo: '', 
    designation: '', 
    appearanceDateTime: '', 
    description: '' 
  });
  const [uploadingGuestPhoto, setUploadingGuestPhoto] = useState(false);

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const domains = ['Technical', 'Cultural', 'Sports'];

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
          rules: parsedData.rules || '',
          date: parsedData.date || '',
          time: parsedData.time || '',
          venue: parsedData.venue || '',
          googleMapsLink: parsedData.googleMapsLink || '',
          maxParticipants: parsedData.maxParticipants || '',
          registrationDeadline: parsedData.registrationDeadline || '',
          isPaid: parsedData.isPaid || false,
          entryFee: parsedData.entryFee || '',
          enableCoupon: parsedData.enableCoupon || false,
          couponCode: parsedData.couponCode || '',
          discountPercent: parsedData.discountPercent || '',
          couponExpiry: parsedData.couponExpiry || '',
          maxCouponUsage: parsedData.maxCouponUsage || '',
          bannerUrl: parsedData.bannerUrl || '',
          contacts: parsedData.contacts || [],
          guests: parsedData.guests || [],
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

  const isValidUrl = (string) => {
    if (!string) return true; // Empty is valid (optional fields)
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const countWords = (str) => {
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error('Failed to upload image');
  };

  // Contact Management
  const handleAddContact = () => {
    if (!currentContact.name.trim()) {
      setMessage('Please enter contact name');
      return;
    }
    if (!currentContact.phone.trim()) {
      setMessage('Please enter contact phone number');
      return;
    }
    // Basic phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(currentContact.phone.replace(/\D/g, ''))) {
      setMessage('Please enter a valid 10-digit phone number');
      return;
    }
    // Email validation if provided
    if (currentContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentContact.email)) {
      setMessage('Please enter a valid email address');
      return;
    }
    setEventData({
      ...eventData,
      contacts: [...eventData.contacts, { ...currentContact, id: Date.now() }]
    });
    setCurrentContact({ name: '', phone: '', email: '', description: '' });
    setMessage('Contact added successfully!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemoveContact = (id) => {
    setEventData({
      ...eventData,
      contacts: eventData.contacts.filter(c => c.id !== id)
    });
  };

  // Guest Management
  const handleAddGuest = async () => {
    if (!currentGuest.name.trim()) {
      setMessage('Please enter guest name');
      return;
    }
    if (!currentGuest.designation.trim()) {
      setMessage('Please enter guest designation');
      return;
    }
    setEventData({
      ...eventData,
      guests: [...eventData.guests, { ...currentGuest, id: Date.now() }]
    });
    setCurrentGuest({ name: '', photo: '', designation: '', appearanceDateTime: '', description: '' });
    setMessage('Guest added successfully!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemoveGuest = (id) => {
    setEventData({
      ...eventData,
      guests: eventData.guests.filter(g => g.id !== id)
    });
  };

  const handleGuestPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }
    try {
      setUploadingGuestPhoto(true);
      const url = await uploadToImgBB(file);
      setCurrentGuest({ ...currentGuest, photo: url });
      setMessage('Guest photo uploaded!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to upload photo');
    } finally {
      setUploadingGuestPhoto(false);
    }
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

  const handleNext = () => {
    // Validation for Step 1
    if (currentStep === 1) {
      if (!eventData.eventName || !eventData.domain || !eventData.description || !eventData.rules) {
        setMessage('Please fill in all required fields');
        return;
      }
      if (countWords(eventData.description) < 20) {
        setMessage('Event description must be at least 20 words');
        return;
      }
      if (!eventData.date || !eventData.time || !eventData.venue || !eventData.registrationDeadline) {
        setMessage('Please fill in all date, time, venue and deadline fields');
        return;
      }
      if (eventData.contacts.length < 1) {
        setMessage('Please add at least 1 contact person');
        return;
      }
      if (eventData.googleMapsLink && !isValidUrl(eventData.googleMapsLink)) {
        setMessage('Please enter a valid Google Maps URL');
        return;
      }
      // Validate registration deadline
      const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
      const deadlineDateTime = new Date(eventData.registrationDeadline);
      if (deadlineDateTime >= eventDateTime) {
        setMessage('Registration deadline must be before the event date');
        return;
      }
    }

    // Validation for Step 4 (Payment)
    if (currentStep === 4) {
      // Validate entry fee for paid events
      if (eventData.isPaid && (!eventData.entryFee || parseFloat(eventData.entryFee) <= 0)) {
        setMessage('Please enter a valid entry fee amount for paid events');
        return;
      }
      // Validate coupon fields if enabled
      if (eventData.isPaid && eventData.enableCoupon) {
        if (!eventData.couponCode || !eventData.couponCode.trim()) {
          setMessage('Please enter a coupon code');
          return;
        }
        if (!eventData.discountPercent || parseFloat(eventData.discountPercent) < 1 || parseFloat(eventData.discountPercent) > 100) {
          setMessage('Discount percentage must be between 1% and 100%');
          return;
        }
      }
    }

    setMessage('');
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setMessage('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // All validations already done in handleNext for step 1
    // Step 2 is optional (guests)
    // Step 3 is registration form (optional fields)

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
        rules: eventData.rules,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        googleMapsLink: eventData.googleMapsLink || '',
        contacts: eventData.contacts,
        guests: eventData.guests,
        maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : null,
        registrationDeadline: eventData.registrationDeadline,
        isPaid: false,
        entryFee: 0,
        coupon: {
          enabled: false
        },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <Link to={`/fest/${festId}/manage`} className="text-primary hover:text-purple-400 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Fest Management
          </Link>
        </div>

        <div className="glass-container border border-white/10 p-4 sm:p-6 md:p-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Create New Event</h1>
          <p className="text-gray-300 mb-4 sm:mb-6">
            Add an event under <strong>{fest.festName}</strong>
          </p>

          {/* Progress Indicator */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {/* Step 1 */}
              <div className="flex items-center flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  1
                </div>
                <div className="hidden sm:block ml-2">
                  <p className={`text-xs sm:text-sm font-medium ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                    Event Details
                  </p>
                </div>
              </div>

              {/* Line 1 */}
              <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-primary' : 'bg-gray-700'}`}></div>

              {/* Step 2 */}
              <div className="flex items-center flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  2
                </div>
                <div className="hidden sm:block ml-2">
                  <p className={`text-xs sm:text-sm font-medium ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                    Special Guests
                  </p>
                </div>
              </div>

              {/* Line 2 */}
              <div className={`flex-1 h-1 mx-2 ${currentStep > 2 ? 'bg-primary' : 'bg-gray-700'}`}></div>

              {/* Step 3 */}
              <div className="flex items-center flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  3
                </div>
                <div className="hidden sm:block ml-2">
                  <p className={`text-xs sm:text-sm font-medium ${currentStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>
                    Registration Form
                  </p>
                </div>
              </div>

              {/* Line 3 */}
              <div className={`flex-1 h-1 mx-2 ${currentStep > 3 ? 'bg-primary' : 'bg-gray-700'}`}></div>

              {/* Step 4 */}
              <div className="flex items-center flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 4 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  4
                </div>
                <div className="hidden sm:block ml-2">
                  <p className={`text-xs sm:text-sm font-medium ${currentStep >= 4 ? 'text-primary' : 'text-gray-400'}`}>
                    Payment
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Labels */}
            <div className="flex sm:hidden justify-between mt-2 text-xs text-center">
              <span className={`flex-1 ${currentStep >= 1 ? 'text-primary font-medium' : 'text-gray-400'}`}>Details</span>
              <span className={`flex-1 ${currentStep >= 2 ? 'text-primary font-medium' : 'text-gray-400'}`}>Guests</span>
              <span className={`flex-1 ${currentStep >= 3 ? 'text-primary font-medium' : 'text-gray-400'}`}>Form</span>
              <span className={`flex-1 ${currentStep >= 4 ? 'text-primary font-medium' : 'text-gray-400'}`}>Payment</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* STEP 1: Event Details */}
            {currentStep === 1 && (
              <>
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
              <p className="text-sm text-gray-500 mt-1">
                Recommended size: 1200x400px (Max 5MB)
              </p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4\">
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

            {/* Location (Venue) */}
            <div>
              <label htmlFor="venue" className="label">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                required
                className="input-field"
                placeholder="e.g., Seminar Hall 2, ABC College"
                value={eventData.venue}
                onChange={handleChange}
              />
            </div>

            {/* Google Maps Link */}
            <div>
              <label htmlFor="googleMapsLink" className="label">
                Google Maps Link (Optional)
              </label>
              <input
                type="url"
                id="googleMapsLink"
                name="googleMapsLink"
                className="input-field"
                placeholder="https://maps.google.com/..."
                value={eventData.googleMapsLink}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Add a Google Maps link to help attendees find the venue
              </p>
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
                placeholder="Describe the event in detail (minimum 20 words)..."
                value={eventData.description}
                onChange={handleChange}
              />
              <p className={`text-sm mt-1 ${countWords(eventData.description) >= 20 ? 'text-green-600' : 'text-gray-500'}`}>
                Word count: {countWords(eventData.description)} / 20 minimum
              </p>
            </div>

            {/* Rules */}
            <div>
              <label htmlFor="rules" className="label">
                Event Rules <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rules"
                name="rules"
                required
                rows="6"
                className="input-field"
                placeholder="Enter event rules, eligibility criteria, guidelines, etc. You can use bullet points, numbers, or paragraphs..."
                value={eventData.rules}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Specify participation rules, team size, eligibility, judging criteria, etc.
              </p>
            </div>

            {/* Contacts Section */}
            <div className="border-t border-white/10 pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                Contact Information <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-400 mb-4">Add at least 1 contact person for this event</p>
              
              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10 mb-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contactName" className="label text-sm">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      className="input-field"
                      placeholder="Contact person name"
                      value={currentContact.name}
                      onChange={(e) => setCurrentContact({...currentContact, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="label text-sm">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      className="input-field"
                      placeholder="10-digit phone number"
                      value={currentContact.phone}
                      onChange={(e) => setCurrentContact({...currentContact, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="label text-sm">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      className="input-field"
                      placeholder="contact@example.com"
                      value={currentContact.email}
                      onChange={(e) => setCurrentContact({...currentContact, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDescription" className="label text-sm">
                      Description (Optional)
                    </label>
                    <textarea
                      id="contactDescription"
                      rows="2"
                      className="input-field"
                      placeholder="e.g., Event Coordinator, Technical Head"
                      value={currentContact.description}
                      onChange={(e) => setCurrentContact({...currentContact, description: e.target.value})}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="btn-secondary w-full"
                  >
                    Add Contact
                  </button>
                </div>
              </div>

              {/* Display Added Contacts */}
              {eventData.contacts.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-white font-semibold">
                    Added Contacts ({eventData.contacts.length}/1 minimum):
                  </p>
                  {eventData.contacts.map(contact => (
                    <div key={contact.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{contact.name}</p>
                        {contact.description && <p className="text-gray-300 text-sm italic">{contact.description}</p>}
                        <p className="text-gray-400 text-sm">{contact.phone}</p>
                        {contact.email && <p className="text-gray-400 text-sm">{contact.email}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contact.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}

            {/* STEP 2: Special Guests (Optional) */}
            {currentStep === 2 && (
              <>
                {/* Guests Section (Optional) */}
                <div className="border-t border-white/10 pt-4 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                    Special Guests (Optional)
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Add judges, chief guests, or special speakers</p>
              
              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10 mb-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="guestName" className="label text-sm">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      id="guestName"
                      className="input-field"
                      placeholder="e.g., Dr. John Doe"
                      value={currentGuest.name}
                      onChange={(e) => setCurrentGuest({...currentGuest, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="guestDesignation" className="label text-sm">
                      Designation
                    </label>
                    <input
                      type="text"
                      id="guestDesignation"
                      className="input-field"
                      placeholder="e.g., CEO of Tech Corp, Judge"
                      value={currentGuest.designation}
                      onChange={(e) => setCurrentGuest({...currentGuest, designation: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label text-sm">Guest Photo (Optional)</label>
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center bg-white/5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGuestPhotoUpload}
                        className="hidden"
                        id="guest-photo-upload"
                        disabled={uploadingGuestPhoto}
                      />
                      <label htmlFor="guest-photo-upload" className="cursor-pointer">
                        {currentGuest.photo ? (
                          <img src={currentGuest.photo} alt="Guest" className="h-20 w-20 rounded-full mx-auto object-cover" />
                        ) : (
                          <>
                            <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div className="text-white text-sm">
                              {uploadingGuestPhoto ? 'Uploading...' : 'Click to upload photo'}
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="guestAppearance" className="label text-sm">
                      Appearance Date/Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="guestAppearance"
                      className="input-field"
                      value={currentGuest.appearanceDateTime}
                      onChange={(e) => setCurrentGuest({...currentGuest, appearanceDateTime: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="guestDescription" className="label text-sm">
                      Brief Description (Optional)
                    </label>
                    <textarea
                      id="guestDescription"
                      rows="3"
                      className="input-field"
                      placeholder="Brief bio or role in the event..."
                      value={currentGuest.description}
                      onChange={(e) => setCurrentGuest({...currentGuest, description: e.target.value})}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddGuest}
                    className="btn-secondary w-full"
                    disabled={uploadingGuestPhoto}
                  >
                    Add Guest
                  </button>
                </div>
              </div>

              {/* Display Added Guests */}
              {eventData.guests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-white font-semibold">
                    Added Guests ({eventData.guests.length}):
                  </p>
                  {eventData.guests.map(guest => (
                    <div key={guest.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex gap-3 items-start">
                      {guest.photo && (
                        <img src={guest.photo} alt={guest.name} className="h-16 w-16 rounded-full object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{guest.name}</p>
                        <p className="text-gray-400 text-sm">{guest.designation}</p>
                        {guest.appearanceDateTime && (
                          <p className="text-gray-400 text-xs">
                            {new Date(guest.appearanceDateTime).toLocaleString()}
                          </p>
                        )}
                        {guest.description && (
                          <p className="text-gray-400 text-sm mt-1">{guest.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(guest.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}

            {/* STEP 3: Registration Form */}
            {currentStep === 3 && (
              <>
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
              </>
            )}

            {/* STEP 4: Payment */}
            {currentStep === 4 && (
              <>
                <div className="border-t border-white/10 pt-4 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                    Payment Configuration
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Configure entry fee and payment options for this event</p>

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
                        <span className="text-gray-700 text-sm sm:text-base">Free Event</span>
                      </label>
                      <label className="flex items-start sm:items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="isPaid"
                          checked={eventData.isPaid}
                          onChange={() => setEventData({...eventData, isPaid: true})}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700 text-sm sm:text-base">Paid Event</span>
                      </label>
                    </div>

                    {/* Entry Amount - shown only for paid events */}
                    {eventData.isPaid && (
                      <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                        <div>
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

                        {/* Coupon System */}
                        <div className="border-t pt-3 sm:pt-4">
                          <label className="label flex items-start sm:items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={eventData.enableCoupon}
                              onChange={(e) => setEventData({
                                ...eventData, 
                                enableCoupon: e.target.checked,
                                couponCode: e.target.checked ? eventData.couponCode : '',
                                discountPercent: e.target.checked ? eventData.discountPercent : '',
                                couponExpiry: e.target.checked ? eventData.couponExpiry : '',
                                maxCouponUsage: e.target.checked ? eventData.maxCouponUsage : ''
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm sm:text-base">🎫 Enable Discount Coupon (Optional)</span>
                          </label>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">Allow students to use a coupon code for discounts</p>
                        </div>

                        {/* Coupon Fields - shown only when enabled */}
                        {eventData.enableCoupon && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                              <div>
                                <label htmlFor="couponCode" className="label">
                                  Coupon Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="couponCode"
                                  name="couponCode"
                                  required
                                  className="input-field"
                                  placeholder="e.g., FEST2026"
                                  value={eventData.couponCode}
                                  onChange={(e) => setEventData({...eventData, couponCode: e.target.value.toUpperCase()})}
                                />
                              </div>

                              <div>
                                <label htmlFor="discountPercent" className="label">
                                  Discount Percentage (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  id="discountPercent"
                                  name="discountPercent"
                                  min="1"
                                  max="100"
                                  required
                                  className="input-field"
                                  placeholder="e.g., 10"
                                  value={eventData.discountPercent}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                              <div>
                                <label htmlFor="couponExpiry" className="label">
                                  Coupon Expiry Date (Optional)
                                </label>
                                <input
                                  type="datetime-local"
                                  id="couponExpiry"
                                  name="couponExpiry"
                                  className="input-field"
                                  value={eventData.couponExpiry}
                                  onChange={handleChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
                              </div>

                              <div>
                                <label htmlFor="maxCouponUsage" className="label">
                                  Max Usage Limit (Optional)
                                </label>
                                <input
                                  type="number"
                                  id="maxCouponUsage"
                                  name="maxCouponUsage"
                                  min="1"
                                  className="input-field"
                                  placeholder="e.g., 50"
                                  value={eventData.maxCouponUsage}
                                  onChange={handleChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                              </div>
                            </div>

                            <div className="bg-blue-100 border border-blue-300 rounded p-2 sm:p-3">
                              <p className="text-xs sm:text-sm text-blue-800">
                                <strong>📊 Preview:</strong> Students using code <strong>{eventData.couponCode || 'CODE'}</strong> will get <strong>{eventData.discountPercent || 0}% OFF</strong>
                                {eventData.entryFee && eventData.discountPercent && (
                                  <span>
                                    {' '}(₹{eventData.entryFee} → ₹{(parseFloat(eventData.entryFee) * (1 - parseFloat(eventData.discountPercent) / 100)).toFixed(2)})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Error Message Display - Above Navigation Buttons */}
            {message && (
              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
                message.includes('success') || message.includes('🎉') ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {message}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
              {/* Previous Button */}
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={loading || uploadingBanner}
                  className="btn-secondary flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50"
                >
                  ← Previous
                </button>
              )}

              {/* Next Button (Steps 1, 2 & 3) */}
              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || uploadingBanner}
                  className="btn-primary flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50"
                >
                  Next →
                </button>
              )}

              {/* Submit Button (Step 4) */}
              {currentStep === 4 && (
                <button
                  type="submit"
                  disabled={loading || uploadingBanner}
                  className="btn-primary flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50"
                >
                  {uploadingBanner ? 'Uploading Banner...' : loading ? (eventData.isPaid ? 'Processing...' : 'Creating Event...') : (eventData.isPaid ? '➡️ Next: Payment Setup' : '🚀 Create Event & Submit for Approval')}
                </button>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  // Clear sessionStorage when canceling
                  sessionStorage.removeItem('pendingEventData');
                  navigate(`/fest/${festId}/manage`);
                }}
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

export default CreateEvent;
