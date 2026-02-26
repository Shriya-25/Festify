import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const CreateFest = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    setMessage('Sponsor added successfully!');
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
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }
    try {
      setUploadingSponsorLogo(true);
      const url = await uploadToImgBB(file);
      setCurrentSponsor({ ...currentSponsor, logoUrl: url });
      setMessage('Sponsor logo uploaded!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to upload logo');
    } finally {
      setUploadingSponsorLogo(false);
    }
  };

  const handleGalleryImageUpload = async (e) => {
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

      await addDoc(collection(db, 'fests'), {
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
        createdBy: currentUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        registrationCount: 0
      });

      setMessage('🎉 Fest created successfully! Waiting for admin approval.');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating fest:', error);
      setMessage('Failed to create fest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:text-orange-400 flex items-center gap-2 font-medium transition-colors text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center flex-1 min-w-fit">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-base transition-all duration-200 ${
                      currentStep >= step 
                        ? 'bg-primary text-white shadow-glow' 
                        : 'bg-white/10 text-gray-500 border-2 border-white/20'
                    }`}
                  >
                    {step}
                  </div>
                  <span className={`mt-1 sm:mt-2 text-xs font-medium whitespace-nowrap ${
                    currentStep >= step ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Details' : step === 2 ? 'Social' : step === 3 ? 'Sponsors' : step === 4 ? 'Banner' : step === 5 ? 'Form' : 'Review'}
                  </span>
                </div>
                {step < 6 && (
                  <div
                    className={`h-1 w-full mx-1 sm:mx-2 rounded transition-all duration-200 ${
                      currentStep > step ? 'bg-primary' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl border ${
            message.includes('success') || message.includes('🎉') 
              ? 'bg-green-900/30 border-green-500/50 text-green-200' 
              : 'bg-red-900/30 border-red-500/50 text-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="glass-container p-4 sm:p-6 md:p-8">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Step 1: Fest Basic Details</h2>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="festName" className="label text-sm">
                    Fest Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="festName"
                    name="festName"
                    required
                    className="input-field"
                    placeholder="e.g., TechFest 2026"
                    value={festData.festName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="collegeName" className="label text-sm">
                    College Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="collegeName"
                    name="collegeName"
                    required
                    className="input-field"
                    placeholder="Enter your college name"
                    value={festData.collegeName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="label text-sm">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="city"
                    name="city"
                    required
                    className="input-field"
                    value={festData.city}
                    onChange={handleChange}
                  >
                    <option value="">Select City</option>
                    {metroCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">City will be displayed on the fest card and used for filtering</p>
                </div>

                <div>
                  <label htmlFor="festStartDate" className="label text-sm">
                    Fest Start Date <span className="text-red-500">*</span>
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
                  <p className="text-xs text-gray-400 mt-1">When the fest begins</p>
                </div>

                <div>
                  <label htmlFor="registrationStartDate" className="label text-sm">
                    Registration Start Date <span className="text-red-500">*</span>
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
                  <p className="text-xs text-gray-400 mt-1">When registrations open</p>
                </div>

                <div>
                  <label htmlFor="registrationEndDate" className="label text-sm">
                    Registration End Date <span className="text-red-500">*</span>
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
                  <p className="text-xs text-gray-400 mt-1">Last date to register</p>
                </div>

                <div>
                  <label htmlFor="category" className="label text-sm">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="input-field"
                    value={festData.category}
                    onChange={handleChange}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="label text-sm">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows="4"
                    className="textarea-field"
                    placeholder="Describe your fest, events, and what makes it special..."
                    value={festData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Social Media Links */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Step 2: Social Media Links</h2>
              <p className="text-gray-400 text-sm mb-4 sm:mb-6">All fields are optional. Add URLs to display on all event pages.</p>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="instagram" className="label text-sm">
                    Instagram URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="instagram"
                    name="instagram"
                    className="input-field"
                    placeholder="https://instagram.com/your_fest"
                    value={festData.socialMedia.instagram}
                    onChange={handleSocialMediaChange}
                  />
                </div>

                <div>
                  <label htmlFor="linkedin" className="label text-sm">
                    LinkedIn URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin"
                    className="input-field"
                    placeholder="https://linkedin.com/company/your_fest"
                    value={festData.socialMedia.linkedin}
                    onChange={handleSocialMediaChange}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="label text-sm">
                    Website URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="input-field"
                    placeholder="https://yourfest.com"
                    value={festData.socialMedia.website}
                    onChange={handleSocialMediaChange}
                  />
                </div>

                <div>
                  <label htmlFor="youtube" className="label text-sm">
                    YouTube URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="youtube"
                    name="youtube"
                    className="input-field"
                    placeholder="https://youtube.com/@your_fest"
                    value={festData.socialMedia.youtube}
                    onChange={handleSocialMediaChange}
                  />
                </div>

                <div>
                  <label htmlFor="twitter" className="label text-sm">
                    Twitter/X URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="twitter"
                    name="twitter"
                    className="input-field"
                    placeholder="https://twitter.com/your_fest"
                    value={festData.socialMedia.twitter}
                    onChange={handleSocialMediaChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Sponsors & Gallery */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Step 3: Sponsors & Gallery</h2>
              <p className="text-gray-400 text-sm mb-4 sm:mb-6">Both sections are optional but enhance your fest presentation.</p>
              
              {/* Sponsors Section */}
              <div className="mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Sponsors (Optional)</h3>
                
                <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10 mb-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="sponsorName" className="label text-sm">
                        Sponsor Name
                      </label>
                      <input
                        type="text"
                        id="sponsorName"
                        className="input-field"
                        placeholder="e.g., Tech Corp"
                        value={currentSponsor.name}
                        onChange={(e) => setCurrentSponsor({...currentSponsor, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="label text-sm">Sponsor Logo</label>
                      <div className="border-2 border-dashed border-white/20 rounded-2xl p-4 text-center bg-white/5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSponsorLogoUpload}
                          className="hidden"
                          id="sponsor-logo-upload"
                          disabled={uploadingSponsorLogo}
                        />
                        <label htmlFor="sponsor-logo-upload" className="cursor-pointer">
                          {currentSponsor.logoUrl ? (
                            <img src={currentSponsor.logoUrl} alt="Sponsor logo" className="h-20 mx-auto" />
                          ) : (
                            <>
                              <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="text-white text-sm">
                                {uploadingSponsorLogo ? 'Uploading...' : 'Click to upload logo'}
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSponsor}
                      className="btn-secondary w-full"
                      disabled={uploadingSponsorLogo}
                    >
                      Add Sponsor
                    </button>
                  </div>
                </div>

                {/* Display Added Sponsors */}
                {festData.sponsors.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {festData.sponsors.map(sponsor => (
                      <div key={sponsor.id} className="bg-white/5 p-4 rounded-xl border border-white/10 relative group">
                        <button
                          onClick={() => handleRemoveSponsor(sponsor.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <img src={sponsor.logoUrl} alt={sponsor.name} className="h-16 w-full object-contain mb-2" />
                        <p className="text-white text-xs text-center truncate">{sponsor.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery Section */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Gallery (Optional)</h3>
                
                <div className="mb-4">
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center bg-white/5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryImageUpload}
                      className="hidden"
                      id="gallery-upload"
                      disabled={uploadingGalleryImage}
                    />
                    <label htmlFor="gallery-upload" className="cursor-pointer">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-white mb-2">
                        {uploadingGalleryImage ? 'Uploading...' : 'Click to add images to gallery'}
                      </div>
                      <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                    </label>
                  </div>
                </div>

                {/* Display Gallery Images */}
                {festData.gallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {festData.gallery.map(image => (
                      <div key={image.id} className="relative group">
                        <img src={image.url} alt="Gallery" className="w-full h-32 object-cover rounded-xl" />
                        <button
                          onClick={() => handleRemoveGalleryImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Step 2: Add Banner Image</h2>
              
              {festData.bannerUrl && (
                <div className="mb-4 sm:mb-6">
                  <label className="label text-sm">Banner Preview</label>
                  <img
                    src={festData.bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-2xl border-2 border-white/10"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="label text-sm">Option 1: Upload Image</label>
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 text-center bg-white/5 hover:bg-white/10 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="banner-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="banner-upload"
                      className={`cursor-pointer ${uploadingImage ? 'opacity-50' : ''}`}
                    >
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="text-white mb-2 font-medium">
                        {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                      </div>
                      <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-dark-100 text-gray-400 font-medium">OR</span>
                  </div>
                </div>

                <div>
                  <label className="label text-sm">Option 2: Add Custom Image Link</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      name="bannerUrl"
                      className="input-field flex-1"
                      placeholder="https://example.com/image.jpg"
                      value={festData.bannerUrl}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={handleCustomUrlSubmit}
                      className="btn-secondary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base whitespace-nowrap"
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
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Step 5: Create Registration Form</h2>
              
              <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={festData.prefillUserData}
                    onChange={(e) => setFestData({...festData, prefillUserData: e.target.checked})}
                    className="w-5 h-5 rounded text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-white font-medium">
                    Auto-fill user profile data
                  </span>
                </label>
                <p className="text-sm text-gray-400 ml-8 mt-1">
                  When enabled, registered users' basic information (Name, Email, Phone, College) will be pre-filled
                </p>
              </div>

              <FormBuilder
                fields={festData.registrationForm}
                onUpdate={handleFormUpdate}
              />
            </div>
          )}

          {/* Step 6: Review & Publish */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Step 6: Review & Publish</h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-semibold text-lg sm:text-xl text-white mb-3 sm:mb-4">Fest Details</h3>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
                    <p className="text-gray-300"><span className="font-semibold text-white">Name:</span> {festData.festName}</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">College:</span> {festData.collegeName}</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">City:</span> {festData.city}</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">Fest Start Date:</span> {festData.festStartDate}</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">Registration Period:</span> {festData.registrationStartDate} to {festData.registrationEndDate}</p>
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">Category:</span> 
                      <span className={`ml-2 badge ${
                        festData.category === 'Technical' ? 'badge-tech' :
                        festData.category === 'Cultural' ? 'badge-culture' :
                        'badge-sports'
                      }`}>{festData.category}</span>
                    </p>
                    <p className="text-gray-300"><span className="font-semibold text-white">Description:</span> {festData.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg sm:text-xl text-white mb-3 sm:mb-4">Social Media</h3>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-2">
                    {Object.entries(festData.socialMedia).some(([, value]) => value) ? (
                      <>
                        {festData.socialMedia.instagram && <p className="text-gray-300"><span className="font-semibold text-white">Instagram:</span> {festData.socialMedia.instagram}</p>}
                        {festData.socialMedia.linkedin && <p className="text-gray-300"><span className="font-semibold text-white">LinkedIn:</span> {festData.socialMedia.linkedin}</p>}
                        {festData.socialMedia.website && <p className="text-gray-300"><span className="font-semibold text-white">Website:</span> {festData.socialMedia.website}</p>}
                        {festData.socialMedia.youtube && <p className="text-gray-300"><span className="font-semibold text-white">YouTube:</span> {festData.socialMedia.youtube}</p>}
                        {festData.socialMedia.twitter && <p className="text-gray-300"><span className="font-semibold text-white">Twitter/X:</span> {festData.socialMedia.twitter}</p>}
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">No social media links added</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg sm:text-xl text-white mb-3 sm:mb-4">Sponsors & Gallery</h3>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-2">
                    <p className="text-gray-300"><span className="font-semibold text-white">Sponsors:</span> {festData.sponsors.length} sponsor(s) added</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">Gallery:</span> {festData.gallery.length} image(s) added</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg sm:text-xl text-white mb-3 sm:mb-4">Banner</h3>
                  {festData.bannerUrl && (
                    <img
                      src={festData.bannerUrl}
                      alt="Banner"
                      className="w-full h-40 sm:h-48 object-cover rounded-2xl border-2 border-white/10"
                    />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg sm:text-xl text-white mb-3 sm:mb-4">Registration Form</h3>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="mb-2 text-gray-300">
                      <span className="font-semibold text-white">Prefill User Data:</span> {festData.prefillUserData ? 'Yes' : 'No'}
                    </p>
                    <p className="mb-2 text-gray-300">
                      <span className="font-semibold text-white">Custom Fields:</span> {festData.registrationForm.length} field(s)
                    </p>
                    {festData.registrationForm.length === 0 && (
                      <p className="text-sm text-gray-400">Standard registration (Name, Email, Phone, College only)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              Previous
            </button>
            
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary disabled:opacity-50 shadow-glow px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                {loading ? 'Publishing...' : 'Publish Fest'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFest;
