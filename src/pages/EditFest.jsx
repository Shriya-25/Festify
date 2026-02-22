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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchingFest, setFetchingFest] = useState(true);
  
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

  useEffect(() => {
    fetchFestDetails();
  }, [festId]);

  const fetchFestDetails = async () => {
    try {
      setFetchingFest(true);
      const festDoc = await getDoc(doc(db, 'fests', festId));
      
      if (!festDoc.exists()) {
        setMessage('Fest not found');
        return;
      }

      const fest = festDoc.data();

      // Check if current user is the creator
      if (fest.createdBy !== currentUser.uid) {
        setMessage('You are not authorized to edit this fest');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // Populate form with existing data
      setFestData({
        festName: fest.festName || '',
        collegeName: fest.collegeName || '',
        category: fest.category || 'Cultural',
        description: fest.description || '',
        date: fest.date || '',
        venue: fest.venue || '',
        bannerUrl: fest.bannerUrl || '',
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

      // Update fest with new data - reset status to pending for re-approval
      await updateDoc(doc(db, 'fests', festId), {
        festName: festData.festName,
        collegeName: festData.collegeName,
        category: festData.category,
        description: festData.description,
        date: festData.date,
        venue: festData.venue,
        bannerUrl: festData.bannerUrl,
        registrationForm: cleanedRegistrationForm,
        prefillUserData: festData.prefillUserData,
        status: 'pending', // Reset to pending for re-approval
        adminComments: '', // Clear previous admin comments
        updatedAt: new Date().toISOString()
      });

      setMessage('🎉 Fest updated successfully! It has been sent for admin re-approval.');

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fest details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4">
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline flex items-center">
            ← Back to Dashboard
          </button>
        </div>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Fest</h1>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Note:</strong> After editing, this fest will be sent back for admin approval. 
              It will show as "Pending" until the admin reviews and approves it again.
            </p>
          </div>
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
                    required
                    className="input-field"
                    value={festData.category}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
                    placeholder="Describe your fest..."
                    value={festData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Banner Upload */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 2: Add Banner Image</h2>
              
              <div className="space-y-6">
                {/* Current Banner Preview */}
                {festData.bannerUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Current Banner</h3>
                    <img
                      src={festData.bannerUrl}
                      alt="Current Banner"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                    />
                  </div>
                )}

                {/* Upload by File */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {festData.bannerUrl ? 'Upload New Banner' : 'Upload Banner'} 
                    <span className="text-red-500"> *</span>
                  </h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-primary/90
                      disabled:opacity-50"
                  />
                  {uploadingImage && (
                    <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Supported formats: JPG, PNG, GIF</p>
                </div>

                {/* OR Divider */}
                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-gray-500 text-sm">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Upload by URL */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Use Image URL</h3>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      name="bannerUrl"
                      placeholder="https://example.com/image.jpg"
                      className="input-field flex-1"
                      value={festData.bannerUrl}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={handleCustomUrlSubmit}
                      className="btn-secondary"
                    >
                      Add URL
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Provide a direct link to your banner image</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Registration Form Builder */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 3: Edit Registration Form</h2>
              
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

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 4: Review & Update</h2>
              
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
                {loading ? 'Updating...' : '✏️ Update Fest'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFest;
