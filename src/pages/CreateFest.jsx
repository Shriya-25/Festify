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
    category: 'Technical',
    description: '',
    date: '',
    venue: '',
    bannerUrl: '',
    registrationForm: [],
    prefillUserData: true
  });

  const categories = ['Technical', 'Cultural', 'Sports'];

  const handleChange = (e) => {
    setFestData({
      ...festData,
      [e.target.name]: e.target.value
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

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
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
      if (!festData.festName || !festData.collegeName || !festData.date || !festData.venue || !festData.description) {
        setMessage('Please fill in all required fields');
        return;
      }
    }

    if (currentStep === 2) {
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
        category: festData.category,
        description: festData.description,
        date: festData.date,
        venue: festData.venue,
        bannerUrl: festData.bannerUrl,
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
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all duration-200 ${
                      currentStep >= step 
                        ? 'bg-primary text-white shadow-glow' 
                        : 'bg-white/10 text-gray-500 border-2 border-white/20'
                    }`}
                  >
                    {step}
                  </div>
                  <span className={`mt-1 sm:mt-2 text-xs sm:text-sm font-medium ${
                    currentStep >= step ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Basic Details' : step === 2 ? 'Banner' : step === 3 ? 'Registration Form' : 'Review'}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 w-full mx-1 sm:mx-2 md:mx-4 rounded transition-all duration-200 ${
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
                  <label htmlFor="date" className="label text-sm">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    className="input-field"
                    value={festData.date}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="venue" className="label text-sm">
                    Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    required
                    className="input-field"
                    placeholder="e.g., Main Auditorium"
                    value={festData.venue}
                    onChange={handleChange}
                  />
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

          {/* Step 2: Banner Image */}
          {currentStep === 2 && (
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

          {/* Step 3: Registration Form Builder */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Step 3: Create Registration Form</h2>
              
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

          {/* Step 4: Review & Publish */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Step 4: Review & Publish</h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-semibold text-lg sm:text-xl text-white mb-3 sm:mb-4">Fest Details</h3>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
                    <p className="text-gray-300"><span className="font-semibold text-white">Name:</span> {festData.festName}</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">College:</span> {festData.collegeName}</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">Date:</span> {festData.date}</p>
                    <p className="text-gray-300"><span className="font-semibold text-white">Venue:</span> {festData.venue}</p>
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
            
            {currentStep < 4 ? (
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
