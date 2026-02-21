import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const CreateFest = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    festName: '',
    collegeName: '',
    category: 'Cultural',
    description: '',
    date: '',
    location: '',
    bannerUrl: ''
  });

  const categories = ['Cultural', 'Technical', 'Sports', 'Literary', 'Music', 'Dance', 'Other'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage('');
      
      await addDoc(collection(db, 'fests'), {
        ...formData,
        createdBy: currentUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setMessage('Fest created successfully! Waiting for admin approval.');
      
      // Reset form
      setFormData({
        festName: '',
        collegeName: '',
        category: 'Cultural',
        description: '',
        date: '',
        location: '',
        bannerUrl: ''
      });

      // Redirect to dashboard after 2 seconds
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Fest</h1>
          <p className="text-gray-600 mb-8">
            Fill in the details below to create a fest listing. Your fest will be reviewed by admin before going live.
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="festName" className="label">
                Fest Name *
              </label>
              <input
                type="text"
                id="festName"
                name="festName"
                required
                className="input-field"
                placeholder="e.g., TechFest 2026"
                value={formData.festName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="collegeName" className="label">
                College Name *
              </label>
              <input
                type="text"
                id="collegeName"
                name="collegeName"
                required
                className="input-field"
                placeholder="e.g., MIT College of Engineering"
                value={formData.collegeName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="category" className="label">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                className="input-field"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="label">
                Fest Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                className="input-field"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="location" className="label">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                className="input-field"
                placeholder="e.g., Mumbai, Maharashtra"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="bannerUrl" className="label">
                Banner Image URL (Optional)
              </label>
              <input
                type="url"
                id="bannerUrl"
                name="bannerUrl"
                className="input-field"
                placeholder="https://example.com/banner.jpg"
                value={formData.bannerUrl}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Provide a URL to an image for your fest banner
              </p>
            </div>

            <div>
              <label htmlFor="description" className="label">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows="6"
                className="input-field"
                placeholder="Describe your fest, events, highlights, and what makes it special..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create Fest'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex-1"
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

export default CreateFest;
