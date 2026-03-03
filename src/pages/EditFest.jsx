import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const EditFest = () => {
  const { festId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingFest, setFetchingFest] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  
  const [festData, setFestData] = useState({
    festName: '',
    collegeName: '',
    city: '',
    category: 'Technical',
    description: '',
    festStartDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    bannerUrl: '',
    socialMedia: {
      instagram: '',
      linkedin: '',
      website: '',
      youtube: '',
      twitter: ''
    },
    sponsors: [],
    gallery: [],
    registrationForm: [],
    prefillUserData: true
  });

  // States for sponsor management
  const [currentSponsor, setCurrentSponsor] = useState({ name: '', logoUrl: '' });
  const [uploadingSponsorLogo, setUploadingSponsorLogo] = useState(false);

  // States for gallery management
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

  const categories = ['Technical', 'Cultural', 'Sports'];
  
  // Predefined metro cities
  const metroCities = ['Pune', 'Mumbai', 'Hyderabad', 'Bangalore', 'Delhi'];

  useEffect(() => {
    fetchFestDetails();
  }, [festId, currentUser]);

  const fetchFestDetails = async () => {
    try {
      setFetchingFest(true);
      const festDoc = await getDoc(doc(db, 'fests', festId));
      
      if (!festDoc.exists()) {
        setMessage('Fest not found');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      const fest = festDoc.data();

      // Check if current user is the creator
      if (fest.createdBy !== currentUser.uid) {
        setMessage('You are not authorized to edit this fest');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // Populate form with existing data, handling new fields gracefully
      setFestData({
        festName: fest.festName || '',
        collegeName: fest.collegeName || '',
        city: fest.city || '',
        category: fest.category || 'Technical',
        description: fest.description || '',
        festStartDate: fest.festStartDate || '',
        registrationStartDate: fest.registrationStartDate || '',
        registrationEndDate: fest.registrationEndDate || '',
        bannerUrl: fest.bannerUrl || '',
        socialMedia: fest.socialMedia || {
            instagram: '',
            linkedin: '',
            website: '',
            youtube: '',
            twitter: ''
        },
        sponsors: fest.sponsors || [],
        gallery: fest.gallery || [],
        registrationForm: fest.registrationForm || [],
        prefillUserData: fest.prefillUserData !== undefined ? fest.prefillUserData : true
      });
    } catch (error) {
      console.error('Error fetching fest:', error);
      setMessage('Error loading fest details');
    } finally {
      setFetchingFest(false);
    }
  };

  const handleChange = (e) => {
    setFestData({
      ...festData,
      [e.target.name]: e.target.value
    });
  };

  const handleSocialMediaChange = (e) => {
    setFestData({
      ...festData,
      socialMedia: {
        ...festData.socialMedia,
        [e.target.name]: e.target.value
      }
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

  const handleAddSponsor = async () => {
    if (!currentSponsor.name.trim()) {
      setMessage('Please enter sponsor name');
      return;
    }
    if (!currentSponsor.logoUrl) {
      setMessage('Please upload sponsor logo');
      return;
    }

    setFestData({
      ...festData,
      sponsors: [...festData.sponsors, { ...currentSponsor, id: Date.now() }]
    });
    setCurrentSponsor({ name: '', logoUrl: '' });
    setMessage('Sponsor added successfully');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemoveSponsor = (id) => {
    setFestData({
      ...festData,
      sponsors: festData.sponsors.filter(s => s.id !== id)
    });
  };

  const handleSponsorLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }
    try {
      setUploadingSponsorLogo(true);
      const url = await uploadToImgBB(file);
      setCurrentSponsor({ ...currentSponsor, logoUrl: url });
      setMessage('Logo uploaded!');
    } catch (error) {
      setMessage('Failed to upload logo');
    } finally {
      setUploadingSponsorLogo(false);
    }
  };

  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }
    try {
      setUploadingGalleryImage(true);
      const url = await uploadToImgBB(file);
      setFestData({
        ...festData,
        gallery: [...festData.gallery, { id: Date.now(), url }]
      });
      setMessage('Image added to gallery!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to upload image');
    } finally {
      setUploadingGalleryImage(false);
    }
  };

  const handleRemoveGalleryImage = (id) => {
    setFestData({
      ...festData,
      gallery: festData.gallery.filter(img => img.id !== id)
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setMessage('');

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFestData({
          ...festData,
          bannerUrl: data.data.url
        });
        setMessage('Image uploaded successfully!');
      } else {
        setMessage('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCustomUrlSubmit = () => {
    if (festData.bannerUrl && isValidUrl(festData.bannerUrl)) {
      setMessage('Banner URL added successfully!');
    } else {
      setMessage('Please enter a valid image URL');
    }
  };

  const handleFormUpdate = (formFields) => {
    setFestData({
      ...festData,
      registrationForm: formFields
    });
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!festData.festName || !festData.collegeName || !festData.city || !festData.festStartDate || !festData.registrationStartDate || !festData.registrationEndDate || !festData.description) {
        setMessage('Please fill in all required fields');
        return;
      }
      
      // Validate date logic
      const regStart = new Date(festData.registrationStartDate);
      const regEnd = new Date(festData.registrationEndDate);
      const festStart = new Date(festData.festStartDate);
      
      if (regStart >= regEnd) {
        setMessage('Registration end date must be after registration start date');
        return;
      }
      
      if (regEnd > festStart) {
        setMessage('Registration must end before or on fest start date');
        return;
      }
    }

    if (currentStep === 2) {
      // Validate social media URLs if provided
      const socialMedia = festData.socialMedia;
      if (socialMedia.instagram && !isValidUrl(socialMedia.instagram)) {
        setMessage('Please enter a valid Instagram URL');
        return;
      }
      if (socialMedia.linkedin && !isValidUrl(socialMedia.linkedin)) {
        setMessage('Please enter a valid LinkedIn URL');
        return;
      }
      if (socialMedia.website && !isValidUrl(socialMedia.website)) {
        setMessage('Please enter a valid Website URL');
        return;
      }
      if (socialMedia.youtube && !isValidUrl(socialMedia.youtube)) {
        setMessage('Please enter a valid YouTube URL');
        return;
      }
      if (socialMedia.twitter && !isValidUrl(socialMedia.twitter)) {
        setMessage('Please enter a valid Twitter/X URL');
        return;
      }
    }

    if (currentStep === 4) {
      if (!festData.bannerUrl) {
        setMessage('Please add a banner image');
        return;
      }
    }

    setMessage('');
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setMessage('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMessage('');

      // Clean registration form data - remove undefined values
      const cleanedRegistrationForm = festData.registrationForm.map(field => {
        const cleanField = {
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || ''
        };
        
        // Only add options if they exist
        if (field.options && field.options.length > 0) {
          cleanField.options = field.options;
        }
        
        return cleanField;
      });

      await updateDoc(doc(db, 'fests', festId), {
        festName: festData.festName,
        collegeName: festData.collegeName,
        city: festData.city,
        category: festData.category,
        description: festData.description,
        festStartDate: festData.festStartDate,
        registrationStartDate: festData.registrationStartDate,
        registrationEndDate: festData.registrationEndDate,
        bannerUrl: festData.bannerUrl,
        socialMedia: festData.socialMedia,
        sponsors: festData.sponsors,
        gallery: festData.gallery,
        registrationForm: cleanedRegistrationForm,
        prefillUserData: festData.prefillUserData,
        updatedAt: new Date().toISOString()
      });

      setMessage('🎉 Fest updated successfully!');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating fest:', error);
      setMessage('Failed to update fest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingFest) {
     return (
        <div className="min-h-screen bg-[#0A0F1F] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-white">Loading Fest Details...</h2>
            </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen relative py-20 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </div>
                <span className="font-medium">Back to Dashboard</span>
            </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between relative z-10">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex flex-col items-center group relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 ${
                    currentStep >= step 
                      ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-[0_0_15px_rgba(157,0,255,0.4)] scale-110' 
                      : 'bg-[#121A2F] text-gray-500 border border-white/10 group-hover:border-white/30'
                  }`}
                >
                  {step}
                </div>
                <span className={`absolute -bottom-8 text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                  currentStep >= step ? 'text-white' : 'text-gray-600'
                }`}>
                  {step === 1 ? 'Details' : step === 2 ? 'Social' : step === 3 ? 'Enhance' : step === 4 ? 'Banner' : step === 5 ? 'Form' : 'Review'}
                </span>
                
                {/* Connecting Line */}
                {step < 6 && (
                    <div className="absolute top-5 left-1/2 w-[calc(100vw/6)] max-w-[140px] h-[2px] -z-10">
                        <div className={`h-full transition-all duration-500 ${currentStep > step ? 'bg-primary' : 'bg-white/5'}`}></div>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
            message.includes('success') || message.includes('🎉') 
              ? 'bg-green-500/10 border-green-500/20 text-green-200' 
              : 'bg-red-500/10 border-red-500/20 text-red-200'
          }`}>
             {message.includes('success') || message.includes('🎉') ? (
                 <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             )}
            <p className="font-medium">{message}</p>
          </div>
        )}

        <div className="glass-card p-6 md:p-10 animate-fade-in-up">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Edit Fest Details</h2>
                <p className="text-gray-400">Update the basics about your event</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="festName" className="label">
                    Fest Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="festName"
                    name="festName"
                    required
                    className="input-field"
                    placeholder="e.g. TechVision 2024"
                    value={festData.festName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="collegeName" className="label">
                    College Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="collegeName"
                    name="collegeName"
                    required
                    className="input-field"
                    placeholder="University Name"
                    value={festData.collegeName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="label">
                    City <span className="text-primary">*</span>
                  </label>
                  <select
                    id="city"
                    name="city"
                    required
                    className="input-field appearance-none"
                    value={festData.city}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-gray-900">Select City</option>
                    {metroCities.map((city) => (
                      <option key={city} value={city} className="bg-gray-900">
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="festStartDate" className="label">
                    Fest Start Date <span className="text-primary">*</span>
                  </label>
                  <input
                    type="date"
                    id="festStartDate"
                    name="festStartDate"
                    required
                    className="input-field"
                    value={festData.festStartDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="label">
                    Category <span className="text-primary">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="input-field appearance-none"
                    value={festData.category}
                    onChange={handleChange}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="registrationStartDate" className="label">
                    Registration Opens <span className="text-primary">*</span>
                  </label>
                  <input
                    type="date"
                    id="registrationStartDate"
                    name="registrationStartDate"
                    required
                    className="input-field"
                    value={festData.registrationStartDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="registrationEndDate" className="label">
                    Registration Closes <span className="text-primary">*</span>
                  </label>
                  <input
                    type="date"
                    id="registrationEndDate"
                    name="registrationEndDate"
                    required
                    className="input-field"
                    value={festData.registrationEndDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="label">
                    Description <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows="4"
                    className="textarea-field"
                    placeholder="Describe what makes your fest unique..."
                    value={festData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Social Media Links */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Connect Socially</h2>
                <p className="text-gray-400">Where can students find more info?</p>
              </div>
              
              <div className="space-y-5">
                {[
                    { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                    { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
                    { id: 'website', label: 'Official Website', placeholder: 'https://...' },
                    { id: 'youtube', label: 'YouTube Channel', placeholder: 'https://youtube.com/...' },
                    { id: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
                ].map((social) => (
                    <div key={social.id}>
                        <label htmlFor={social.id} className="label">{social.label} (Optional)</label>
                        <input
                            type="url"
                            id={social.id}
                            name={social.id}
                            className="input-field"
                            placeholder={social.placeholder}
                            value={festData.socialMedia[social.id]}
                            onChange={handleSocialMediaChange}
                        />
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Sponsors & Gallery */}
          {currentStep === 3 && (
            <div className="space-y-8">
               <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Enhance Your Page</h2>
                <p className="text-gray-400">Add sponsors and gallery images to build trust</p>
              </div>

              {/* Sponsors Section */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-primary">✨</span> Sponsors
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <input
                        type="text"
                        className="input-field mb-2"
                        placeholder="Sponsor Name"
                        value={currentSponsor.name}
                        onChange={(e) => setCurrentSponsor({...currentSponsor, name: e.target.value})}
                        />
                         <button
                            type="button"
                            onClick={handleAddSponsor}
                            className="btn-secondary w-full"
                            disabled={uploadingSponsorLogo}
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Add Sponsor
                        </button>
                    </div>

                    <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleSponsorLogoUpload}
                            className="hidden"
                            id="sponsor-logo-upload"
                            disabled={uploadingSponsorLogo}
                        />
                        <label htmlFor="sponsor-logo-upload" className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                            {currentSponsor.logoUrl ? (
                                <img src={currentSponsor.logoUrl} alt="Preview" className="h-16 object-contain" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </div>
                                    <p className="text-xs text-gray-400">{uploadingSponsorLogo ? 'Uploading...' : 'Upload Logo'}</p>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* Display Sponsors */}
                {festData.sponsors.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {festData.sponsors.map(sponsor => (
                      <div key={sponsor.id} className="bg-[#121A2F] p-3 rounded-lg border border-white/10 relative group w-24 flex flex-col items-center">
                        <button
                          onClick={() => handleRemoveSponsor(sponsor.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ×
                        </button>
                        <img src={sponsor.logoUrl} alt={sponsor.name} className="h-10 w-full object-contain mb-1" />
                        <p className="text-[10px] text-gray-400 text-center truncate w-full">{sponsor.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery Section */}
               <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-accent">🖼️</span> Gallery
                </h3>
                
                <div className="mb-6">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryImageUpload}
                      className="hidden"
                      id="gallery-upload"
                      disabled={uploadingGalleryImage}
                    />
                    <label htmlFor="gallery-upload" className="cursor-pointer block text-center border-2 border-dashed border-white/10 rounded-xl p-8 hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-white font-medium mb-1">{uploadingGalleryImage ? 'Uploading...' : 'Drop images here or click to upload'}</p>
                        <p className="text-xs text-gray-500">Supports PNG, JPG up to 5MB</p>
                    </label>
                </div>

                {/* Display Gallery Images */}
                {festData.gallery.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {festData.gallery.map(image => (
                      <div key={image.id} className="relative group aspect-square">
                        <img src={image.url} alt="Gallery" className="w-full h-full object-cover rounded-lg border border-white/10" />
                        <button
                          onClick={() => handleRemoveGalleryImage(image.id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Banner Image */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Fest Banner</h2>
                <p className="text-gray-400">Update the banner image for your fest page</p>
              </div>

              {festData.bannerUrl && (
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-6">
                  <img
                    src={festData.bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-48 sm:h-64 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image';
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Upload Option */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="banner-upload"
                      disabled={uploadingImage}
                    />
                    <label htmlFor="banner-upload" className="cursor-pointer block h-full flex flex-col items-center justify-center">
                         <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                         </div>
                        <h4 className="text-white font-medium mb-1">{uploadingImage ? 'Uploading...' : 'Upload Image'}</h4>
                        <p className="text-xs text-gray-500">Max size 5MB</p>
                    </label>
                </div>

                {/* URL Option */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
                    <h4 className="text-white font-medium mb-3">Or use an image URL</h4>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            name="bannerUrl"
                            className="input-field"
                            placeholder="https://..."
                            value={festData.bannerUrl}
                            onChange={handleChange}
                        />
                         <button
                            type="button"
                            onClick={handleCustomUrlSubmit}
                            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl px-4 transition-colors font-medium text-sm"
                        >
                            Validate
                        </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Registration Form Builder */}
          {currentStep === 5 && (
            <div className="space-y-6">
               <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Registration Form</h2>
                <p className="text-gray-400">Customize what data you collect from students</p>
              </div>
              
              <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-xl border border-primary/20 flex items-center justify-between">
                <div>
                    <h4 className="text-white font-medium">Smart Prefill</h4>
                    <p className="text-xs text-gray-400">Auto-fill Student Name, Email & College</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={festData.prefillUserData}
                    onChange={(e) => setFestData({...festData, prefillUserData: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <FormBuilder
                fields={festData.registrationForm}
                onUpdate={handleFormUpdate}
              />
            </div>
          )}

          {/* Step 6: Review & Publish */}
          {currentStep === 6 && (
            <div className="space-y-6">
               <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Review Changes</h2>
                <p className="text-gray-400">Review your updates before saving</p>
              </div>
              
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="relative h-48">
                    <img src={festData.bannerUrl || 'https://via.placeholder.com/800x400'} className="w-full h-full object-cover" alt="Banner" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                        <div>
                            <span className="badge badge-tech mb-2">{festData.category}</span>
                            <h2 className="text-3xl font-bold text-white">{festData.festName}</h2>
                            <p className="text-gray-300 flex items-center gap-1 text-sm mt-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {festData.city} | {festData.collegeName}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">About</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{festData.description}</p>
                    </div>
                    <div className="space-y-3">
                         <div>
                            <h4 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Timeline</h4>
                            <p className="text-white text-sm">Fest Starts: <span className="text-primary">{festData.festStartDate}</span></p>
                            <p className="text-white text-sm">Registration: <span className="text-gray-300">{festData.registrationStartDate} - {festData.registrationEndDate}</span></p>
                        </div>
                        <div>
                             <h4 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Integrations</h4>
                             <p className="text-sm text-gray-300">Form Fields: {festData.registrationForm.length}</p>
                             <p className="text-sm text-gray-300">Sponsors: {festData.sponsors.length}</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-xl border border-white/10 text-white font-medium transition-all ${
                currentStep === 1 
                  ? 'opacity-0 pointer-events-none' 
                  : 'hover:bg-white/5 hover:border-white/20'
              }`}
            >
              Previous Step
            </button>
            
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
              >
                Continue
                <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary shadow-glow"
              >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Updating...
                    </div>
                ) : 'Update Fest'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFest;
