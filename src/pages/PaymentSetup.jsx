import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const PaymentSetup = () => {
  const { festId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [eventData, setEventData] = useState(null);
  
  const [paymentMethod, setPaymentMethod] = useState('manual'); // 'manual' or 'razorpay'
  
  // Manual QR Payment States
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [uploadingQR, setUploadingQR] = useState(false);
  
  // Razorpay Payment States
  const [razorpayData, setRazorpayData] = useState({
    apiKey: '',
    secretKey: '',
    businessName: '',
    successRedirectURL: '',
    failureRedirectURL: ''
  });

  useEffect(() => {
    // Load pending event data from sessionStorage
    const pendingData = sessionStorage.getItem('pendingEventData');
    if (!pendingData) {
      setMessage('No event data found. Please start from event creation.');
      setTimeout(() => navigate(`/fest/${festId}/create-event`), 2000);
      return;
    }
    
    try {
      const parsedData = JSON.parse(pendingData);
      setEventData(parsedData);
    } catch (error) {
      console.error('Error parsing event data:', error);
      setMessage('Invalid event data. Please start over.');
      setTimeout(() => navigate(`/fest/${festId}/create-event`), 2000);
    }
  }, [festId, navigate]);

  const handleQrFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage('QR image must be less than 5MB');
        return;
      }
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const uploadQrToImgBB = async () => {
    if (!qrFile) return null;

    try {
      setUploadingQR(true);
      const formData = new FormData();
      formData.append('image', qrFile);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        return data.data.url;
      } else {
        throw new Error('Failed to upload QR image');
      }
    } catch (error) {
      console.error('Error uploading QR image:', error);
      throw error;
    } finally {
      setUploadingQR(false);
    }
  };

  const handleRazorpayChange = (e) => {
    setRazorpayData({
      ...razorpayData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventData) {
      setMessage('Event data not loaded. Please try again.');
      return;
    }

    // Validate payment configuration
    if (paymentMethod === 'manual') {
      if (!qrFile && !qrPreview) {
        setMessage('Please upload a QR code image');
        return;
      }
      if (!paymentInstructions.trim()) {
        setMessage('Please provide payment instructions');
        return;
      }
    } else if (paymentMethod === 'razorpay') {
      if (!razorpayData.apiKey || !razorpayData.secretKey || !razorpayData.businessName) {
        setMessage('Please fill in all Razorpay required fields');
        return;
      }
    }

    try {
      setLoading(true);
      setMessage('');

      let paymentConfig = {
        method: paymentMethod
      };

      if (paymentMethod === 'manual') {
        // Upload QR image
        setMessage('Uploading QR code...');
        const qrImageURL = await uploadQrToImgBB();
        if (!qrImageURL) {
          setMessage('Failed to upload QR code. Please try again.');
          setLoading(false);
          return;
        }

        paymentConfig = {
          method: 'manual',
          qrImageURL,
          instructions: paymentInstructions
        };
      } else {
        // Note: In production, secretKey should be stored securely on backend
        // For now, storing in Firestore with limited access via security rules
        paymentConfig = {
          method: 'razorpay',
          apiKey: razorpayData.apiKey,
          secretKey: razorpayData.secretKey, // ⚠️ Should be handled via backend/cloud function in production
          businessName: razorpayData.businessName,
          successRedirectURL: razorpayData.successRedirectURL || '',
          failureRedirectURL: razorpayData.failureRedirectURL || ''
        };
      }

      // Clean registration form data
      const cleanedRegistrationForm = (eventData.registrationForm || []).map(field => {
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

      // Create event with payment configuration
      const newEventData = {
        festId: festId,
        festName: eventData.festName,
        eventName: eventData.eventName,
        domain: eventData.domain,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : null,
        registrationDeadline: eventData.registrationDeadline,
        isPaid: true,
        entryFee: parseFloat(eventData.entryFee),
        paymentConfig,
        coupon: eventData.enableCoupon ? {
          enabled: true,
          code: eventData.couponCode.toUpperCase(),
          discountPercent: parseFloat(eventData.discountPercent),
          expiryDate: eventData.couponExpiry || null,
          maxUsage: eventData.maxCouponUsage ? parseInt(eventData.maxCouponUsage) : null,
          usedCount: 0
        } : {
          enabled: false
        },
        bannerUrl: eventData.bannerUrl || '',
        registrationForm: cleanedRegistrationForm,
        prefillUserData: eventData.prefillUserData !== false,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        participantCount: 0,
        status: 'pending',
        adminComments: ''
      };

      console.log('Creating paid event with data:', newEventData);

      await addDoc(collection(db, 'events'), newEventData);

      // Clear session storage
      sessionStorage.removeItem('pendingEventData');

      setMessage('🎉 Paid event created successfully! It will be visible once approved by admin.');
      
      setTimeout(() => {
        navigate(`/fest/${festId}/manage`);
      }, 2000);
    } catch (error) {
      console.error('Error creating paid event:', error);
      setMessage(`Failed to create event: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <Link to={`/fest/${festId}/create-event`} className="text-primary hover:text-purple-400 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Event Details
          </Link>
        </div>

        <div className="glass-container border border-white/10 p-4 sm:p-6 md:p-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Payment Configuration</h1>
          <p className="text-sm sm:text-base text-gray-300 mb-2">
            Configure payment method for <strong>{eventData.eventName}</strong>
          </p>
          <p className="text-base sm:text-lg font-semibold text-primary mb-4 sm:mb-6 md:mb-8">
            Entry Fee: ₹{eventData.entryFee}
          </p>

          {message && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
              message.includes('success') || message.includes('🎉') ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2 sm:space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer border border-white/10 rounded-lg p-3 sm:p-4 bg-white/5 hover:bg-white/10 transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="manual"
                    checked={paymentMethod === 'manual'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="text-white font-medium text-sm sm:text-base">Manual QR Payment</span>
                    <p className="text-xs sm:text-sm text-gray-400">Students pay via UPI/QR and upload payment proof</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer border border-white/10 rounded-lg p-3 sm:p-4 bg-white/5 hover:bg-white/10 transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="text-white font-medium text-sm sm:text-base">Razorpay Payment Gateway</span>
                    <p className="text-xs sm:text-sm text-gray-400">Automated payment processing with instant confirmation</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Manual QR Payment Configuration */}
            {paymentMethod === 'manual' && (
              <div className="border-t border-white/10 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-white">Manual QR Payment Setup</h3>
                
                {/* QR Code Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload QR Code Image <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                  {qrPreview && (
                    <div className="mt-3 sm:mt-4 flex justify-center">
                      <img
                        src={qrPreview}
                        alt="QR Code preview"
                        className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain border border-white/10 rounded-lg"
                      />
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Upload your UPI/payment QR code (Max 5MB)
                  </p>
                </div>

                {/* Payment Instructions */}
                <div>
                  <label htmlFor="paymentInstructions" className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Instructions <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="paymentInstructions"
                    rows="4"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="e.g., Scan the QR code and pay ₹2000. After payment, upload screenshot and enter transaction ID."
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Provide clear instructions for students on how to complete the payment
                  </p>
                </div>
              </div>
            )}

            {/* Razorpay Payment Configuration */}
            {paymentMethod === 'razorpay' && (
              <div className="border-t border-white/10 pt-6 space-y-6">
                <h3 className="text-lg font-semibold text-white">Razorpay Configuration</h3>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-400">
                    <strong>Security Note:</strong> Only the API Key (Key ID) is used for frontend payment processing. 
                    The Secret Key is stored but not exposed to students. In production, consider using Razorpay's 
                    order creation API via a secure backend for enhanced security.
                  </p>
                </div>

                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                    Razorpay Key ID (API Key) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="apiKey"
                    name="apiKey"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="rzp_test_xxxxxxxxxxxxx or rzp_live_xxxxxxxxxxxxx"
                    value={razorpayData.apiKey}
                    onChange={handleRazorpayChange}
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    This will be used for payment processing on the frontend
                  </p>
                </div>

                <div>
                  <label htmlFor="secretKey" className="block text-sm font-medium text-gray-300 mb-2">
                    Razorpay Secret Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="secretKey"
                    name="secretKey"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="Enter your Razorpay secret key"
                    value={razorpayData.secretKey}
                    onChange={handleRazorpayChange}
                    required
                  />
                  <p className="text-sm text-red-400 mt-1">
                    Keep this confidential. Should be handled via backend in production.
                  </p>
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-2">
                    Business Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="e.g., College Fest Organizers"
                    value={razorpayData.businessName}
                    onChange={handleRazorpayChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="successRedirectURL" className="block text-sm font-medium text-gray-300 mb-2">
                    Success Redirect URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="successRedirectURL"
                    name="successRedirectURL"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="https://yoursite.com/payment-success"
                    value={razorpayData.successRedirectURL}
                    onChange={handleRazorpayChange}
                  />
                </div>

                <div>
                  <label htmlFor="failureRedirectURL" className="block text-sm font-medium text-gray-300 mb-2">
                    Failure Redirect URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="failureRedirectURL"
                    name="failureRedirectURL"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="https://yoursite.com/payment-failure"
                    value={razorpayData.failureRedirectURL}
                    onChange={handleRazorpayChange}
                  />
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading || uploadingQR}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {uploadingQR ? 'Uploading QR...' : loading ? 'Submitting Event...' : 'Submit Event for Approval'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Don't remove sessionStorage - let user go back to edit event details
                  navigate(`/fest/${festId}/create-event`);
                }}
                className="btn-secondary flex-1"
                disabled={loading || uploadingQR}
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

export default PaymentSetup;
