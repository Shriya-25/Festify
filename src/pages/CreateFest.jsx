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
    category: 'Cultural',
    description: '',
    date: '',
    venue: '',
    bannerUrl: '',
    registrationForm: [],
    prefillUserData: true
  });

  const categories = ['Cultural', 'Technical', 'Sports', 'Literary', 'Music', 'Dance', 'Other'];

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline flex items-center">
            ← Back to Dashboard
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    style={{ width: '100px' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-primary font-semibold' : 'text-gray-500'}>Basic Details</span>
            <span className={currentStep >= 2 ? 'text-primary font-semibold' : 'text-gray-500'}>Banner</span>
            <span className={currentStep >= 3 ? 'text-primary font-semibold' : 'text-gray-500'}>Registration Form</span>
            <span className={currentStep >= 4 ? 'text-primary font-semibold' : 'text-gray-500'}>Review</span>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') || message.includes('🎉') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 1: Fest Basic Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="festName" className="label">
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
                  <label htmlFor="collegeName" className="label">
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
                  <label htmlFor="date" className="label">
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
                  <label htmlFor="venue" className="label">
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
                  <label htmlFor="category" className="label">
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
                  <label htmlFor="description" className="label">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows="4"
                    className="input-field"
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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 2: Add Banner Image</h2>
              
              {festData.bannerUrl && (
                <div className="mb-6">
                  <label className="label">Banner Preview</label>
                  <img
                    src={festData.bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="label">Option 1: Upload Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                      <div className="text-gray-600 mb-2">
                        {uploadingImage ? '⏳ Uploading...' : '📤 Click to upload image'}
                      </div>
                      <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                    </label>
                  </div>
                </div>

                <div className="text-center text-gray-500">OR</div>

                <div>
                  <label className="label">Option 2: Add Custom Image Link</label>
                  <div className="flex gap-2">
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
                      className="btn-secondary"
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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 3: Create Registration Form</h2>
              
              <div className="mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={festData.prefillUserData}
                    onChange={(e) => setFestData({...festData, prefillUserData: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">
                    ☑ Auto-fill user profile data (Name, Email, Phone, College)
                  </span>
                </label>
                <p className="text-sm text-gray-500 ml-6 mt-1">
                  When enabled, registered users' basic information will be pre-filled in the form
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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 4: Review & Publish</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Fest Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {festData.festName}</p>
                    <p><strong>College:</strong> {festData.collegeName}</p>
                    <p><strong>Date:</strong> {festData.date}</p>
                    <p><strong>Venue:</strong> {festData.venue}</p>
                    <p><strong>Category:</strong> {festData.category}</p>
                    <p><strong>Description:</strong> {festData.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Banner</h3>
                  {festData.bannerUrl && (
                    <img
                      src={festData.bannerUrl}
                      alt="Banner"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Registration Form</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="mb-2">
                      <strong>Prefill User Data:</strong> {festData.prefillUserData ? 'Yes' : 'No'}
                    </p>
                    <p className="mb-2">
                      <strong>Custom Fields:</strong> {festData.registrationForm.length} field(s)
                    </p>
                    {festData.registrationForm.length === 0 && (
                      <p className="text-sm text-gray-500">Standard registration (Name, Email, Phone, College only)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Publishing...' : '🚀 Publish Fest'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFest;
