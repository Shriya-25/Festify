import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const EventDetails = () => {
  const { eventId } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Payment-related states
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [razorpayPaymentData, setRazorpayPaymentData] = useState(null);
  const [processingRazorpay, setProcessingRazorpay] = useState(false);
  
  // Coupon-related states
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchEventDetails();
    if (currentUser) {
      checkRegistrationStatus();
    }
  }, [eventId, currentUser]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        
        // Check if event is approved (unless user is organizer who created it)
        if (eventData.status !== 'approved' && eventData.createdBy !== currentUser?.uid) {
          navigate('/');
          return;
        }
        
        setEvent(eventData);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const regsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(regsQuery);
      setIsRegistered(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return now < deadline &&
(!event.maxParticipants || event.participantCount < event.maxParticipants);
  };

  const openRegistrationModal = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentUser.emailVerified && currentUser.providerData[0]?.providerId === 'password') {
      setMessage('Please verify your email before registering');
      setTimeout(() => navigate('/verify-email'), 2000);
      return;
    }

    // Verify user role from database
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        setMessage('User profile not found. Please complete your profile first.');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      const userData = userDoc.data();
      
      if (userData.role !== 'student') {
        setMessage('Only students can register for events');
        return;
      }

      if (!isRegistrationOpen()) {
        setMessage('Registration is closed for this event');
        return;
      }

      // Always show registration form first (regardless of free/paid)
      // Initialize form data
      const initialFormData = {};
      
      if (event.prefillUserData) {
        initialFormData.name = userData?.name || currentUser.displayName || '';
        initialFormData.email = userData?.email || currentUser.email || '';
        initialFormData.phone = userData?.phone || '';
        initialFormData.college = userData?.college || '';
        initialFormData.branch = userData?.branch || '';
        initialFormData.year = userData?.year || '';
        initialFormData.gender = userData?.gender || '';
      }

      if (event.registrationForm && event.registrationForm.length > 0) {
        event.registrationForm.forEach(field => {
          initialFormData[field.id] = field.type === 'checkbox' ? false : '';
        });
      }

      setFormData(initialFormData);
      setShowRegistrationModal(true);
      setMessage('');
    } catch (error) {
      console.error('Error opening registration modal:', error);
      setMessage('Error loading registration form. Please try again.');
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Screenshot must be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      setPaymentScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const uploadScreenshotToImgBB = async () => {
    if (!paymentScreenshot) return null;

    try {
      setUploadingScreenshot(true);
      const formData = new FormData();
      formData.append('image', paymentScreenshot);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        return data.data.url;
      } else {
        throw new Error('Failed to upload screenshot');
      }
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      throw error;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleRegistrationFormSubmit = async (e) => {
    e.preventDefault();

    // Check deadline again
    if (!isRegistrationOpen()) {
      setMessage('Registration deadline has passed or event is full');
      return;
    }

    // If event is paid, show payment step
    if (event.isPaid && event.paymentConfig) {
      // Set original and final amounts
      setOriginalAmount(event.entryFee);
      setFinalAmount(event.entryFee);
      
      setShowRegistrationModal(false);
      setShowPaymentStep(true);
      setMessage('');
      return;
    }

    // If free event, submit registration directly
    await handleSubmitRegistration(e);
  };

  // Apply coupon code
  const handleApplyCoupon = () => {
    setCouponError('');
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    // Check if coupon is enabled
    if (!event.coupon || !event.coupon.enabled) {
      setCouponError('No coupon available for this event');
      return;
    }

    // Validate coupon code
    if (couponCode.toUpperCase() !== event.coupon.code) {
      setCouponError('Invalid coupon code');
      return;
    }

    // Check expiry date
    if (event.coupon.expiryDate) {
      const now = new Date();
      const expiry = new Date(event.coupon.expiryDate);
      if (now > expiry) {
        setCouponError('This coupon has expired');
        return;
      }
    }

    // Check usage limit
    if (event.coupon.maxUsage && event.coupon.usedCount >= event.coupon.maxUsage) {
      setCouponError('Coupon usage limit reached');
      return;
    }

    // Apply discount
    const discount = originalAmount * (event.coupon.discountPercent / 100);
    const discountedAmount = originalAmount - discount;
    
    setFinalAmount(discountedAmount);
    setAppliedCoupon({
      code: event.coupon.code,
      discountPercent: event.coupon.discountPercent,
      discountAmount: discount
    });
    setCouponApplied(true);
    setMessage(`Coupon applied! You save ₹${discount.toFixed(2)}`);
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setAppliedCoupon(null);
    setFinalAmount(originalAmount);
    setCouponCode('');
    setCouponError('');
    setMessage('');
  };

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      setProcessingRazorpay(true);
      setMessage('Loading payment gateway...');

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setMessage('Failed to load Razorpay. Please check your internet connection.');
        setProcessingRazorpay(false);
        return;
      }

      const options = {
        key: event.paymentConfig.apiKey,
        amount: finalAmount * 100, // Amount in paise (use discounted amount if coupon applied)
        currency: 'INR',
        name: event.paymentConfig.businessName || event.festName,
        description: `Payment for ${event.eventName}`,
        image: event.bannerUrl || '',
        handler: async function (response) {
          // Payment successful
          console.log('Razorpay payment success:', response);
          
          const paymentData = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || '',
            razorpay_signature: response.razorpay_signature || '',
            paymentStatus: 'success',
            paidAt: new Date().toISOString()
          };

          setRazorpayPaymentData(paymentData);
          setMessage('Payment successful! Completing registration...');
          
          // Submit registration after successful payment with payment data
          await handleSubmitRegistration(null, paymentData);
        },
        modal: {
          ondismiss: function() {
            setMessage('Payment cancelled. Please try again.');
            setProcessingRazorpay(false);
          }
        },
        prefill: {
          name: formData.name || '',
          email: formData.email || '',
          contact: formData.phone || ''
        },
        theme: {
          color: '#4F46E5' // Indigo color matching the theme
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        setMessage(`Payment failed: ${response.error.description}. Please try again.`);
        setProcessingRazorpay(false);
      });

      razorpay.open();
      setProcessingRazorpay(false);
      setMessage(''); // Clear loading message when checkout opens
      
    } catch (error) {
      console.error('Error initiating Razorpay payment:', error);
      setMessage('Error initiating payment. Please try again.');
      setProcessingRazorpay(false);
    }
  };

  const handleFinalSubmit = async () => {
    // Validate payment proof for manual payments
    if (event.paymentConfig.method === 'manual') {
      if (!paymentScreenshot) {
        setMessage('Please upload payment screenshot');
        return;
      }
      if (!transactionId.trim()) {
        setMessage('Please enter transaction ID');
        return;
      }
    }

    // Submit the registration with payment info
    await handleSubmitRegistration(null);
  };

  const handleFormChange = (e, fieldId) => {
    const { type, value, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [fieldId]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [fieldId]: files[0] });
    } else {
      setFormData({ ...formData, [fieldId]: value });
    }
  };

  const handleSubmitRegistration = async (e, razorpayPaymentDataParam = null) => {
    if (e) e.preventDefault();

    // Check deadline again (backend validation)
    if (!isRegistrationOpen()) {
      setMessage('Registration deadline has passed or event is full');
      return;
    }

    try {
      setRegistering(true);
      setMessage('');

      console.log('Starting registration...', {
        eventId,
        eventData: event,
        formData,
        currentUser: currentUser.uid
      });

      const registrationData = {
        eventId: eventId,
        festId: event.festId,
        userId: currentUser.uid,
        eventName: event.eventName,
        festName: event.festName,
        eventCreatedBy: event.createdBy,
        registeredAt: new Date().toISOString()
      };

      // Add coupon information if applied (for paid events)
      if (event.isPaid && couponApplied && appliedCoupon) {
        registrationData.couponUsed = {
          code: appliedCoupon.code,
          discountPercent: appliedCoupon.discountPercent,
          discountAmount: appliedCoupon.discountAmount,
          originalAmount: originalAmount,
          finalAmount: finalAmount
        };
      } else if (event.isPaid) {
        registrationData.couponUsed = null;
        registrationData.originalAmount = originalAmount;
        registrationData.finalAmount = finalAmount;
      }

      // Add payment information for paid events
      if (event.isPaid && event.paymentConfig) {
        if (event.paymentConfig.method === 'manual') {
          // Upload payment screenshot
          setMessage('Uploading payment proof...');
          const screenshotURL = await uploadScreenshotToImgBB();
          if (!screenshotURL) {
            setMessage('Failed to upload payment screenshot. Please try again.');
            setRegistering(false);
            return;
          }

          registrationData.paymentProof = {
            screenshotURL,
            transactionId,
            paymentStatus: 'pending_verification',
            submittedAt: new Date().toISOString(),
            amountPaid: finalAmount
          };
          registrationData.paymentVerified = false;
        } else if (event.paymentConfig.method === 'razorpay') {
          // For Razorpay, add payment details from successful transaction
          const paymentDataToUse = razorpayPaymentDataParam || razorpayPaymentData;
          
          if (paymentDataToUse) {
            registrationData.paymentProof = {
              ...paymentDataToUse,
              paymentMethod: 'razorpay',
              amountPaid: finalAmount
            };
            registrationData.paymentVerified = true;
            registrationData.paymentStatus = 'success';
          } else {
            setMessage('Payment information missing. Please try again.');
            setRegistering(false);
            return;
          }
        }
      }

      if (event.prefillUserData) {
        registrationData.name = formData.name;
        registrationData.email = formData.email;
        registrationData.phone = formData.phone;
        registrationData.college = formData.college;
        registrationData.branch = formData.branch || '';
        registrationData.year = formData.year || '';
        registrationData.gender = formData.gender || '';
      }

      if (event.registrationForm && event.registrationForm.length > 0) {
        const customResponses = {};
        event.registrationForm.forEach(field => {
          if (field.type === 'file' && formData[field.id]) {
            customResponses[field.label] = formData[field.id].name;
          } else {
            customResponses[field.label] = formData[field.id] || '';
          }
        });
        registrationData.customFields = customResponses;
      }

      console.log('Registration data to submit:', registrationData);

      await addDoc(collection(db, 'eventRegistrations'), registrationData);

      console.log('Registration document created successfully');

      // Update participant count and coupon usage
      const eventUpdateData = {
        participantCount: increment(1)
      };
      
      // Increment coupon usage if coupon was applied
      if (event.isPaid && couponApplied && appliedCoupon) {
        eventUpdateData['coupon.usedCount'] = increment(1);
      }
      
      await updateDoc(doc(db, 'events', eventId), eventUpdateData);
      
      console.log('Participant count updated');
      if (couponApplied) {
        console.log('Coupon usage count incremented');
      }

      setIsRegistered(true);
      setShowRegistrationModal(false);
      setShowPaymentStep(false);
      
      if (event.isPaid && event.paymentConfig.method === 'manual') {
        setMessage('🎉 Registration submitted! Your payment is pending verification by the organizer.');
      } else {
        setMessage('🎉 Successfully registered for the event!');
      }
      
      // Reset payment states
      setPaymentScreenshot(null);
      setPaymentScreenshotPreview('');
      setTransactionId('');
      setRazorpayPaymentData(null);
      setProcessingRazorpay(false);
      
      // Refresh event data
      fetchEventDetails();
    } catch (error) {
      console.error('Error registering:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to register. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please ensure you have a student account and your profile is complete.';
      } else if (error.message) {
        errorMessage = `Failed to register: ${error.message}`;
      }
      
      setMessage(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const registrationStatus = !isRegistrationOpen() ? 'closed' : isRegistered ? 'registered' : 'open';

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Banner Image */}
        {event.bannerUrl && (
          <div className="mb-4 sm:mb-6">
            <img
              src={event.bannerUrl}
              alt={event.eventName}
              className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Event Details Card */}
        <div className="glass-container p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 space-y-3 md:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">{event.eventName}</h1>
              <p className="text-lg sm:text-xl text-gray-300">{event.festName}</p>
            </div>
            <div className="md:text-right">
              <span className={`inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                registrationStatus === 'closed' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : registrationStatus === 'registered'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {registrationStatus === 'closed' ? 'Registrations Closed' 
                  : registrationStatus === 'registered' ? 'Registered' 
                  : 'Open for Registration'}
              </span>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 sm:px-3 bg-white/5 text-gray-300 rounded text-xs sm:text-sm">
                  {event.domain}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-lg">
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Date & Time</p>
              <p className="font-semibold text-white text-sm sm:text-base">
                {new Date(event.date).toLocaleDateString()} at {event.time}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Venue</p>
              <p className="font-semibold text-white text-sm sm:text-base">{event.venue}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Entry Fees</p>
              <p className="font-semibold text-white text-lg sm:text-xl md:text-2xl">
                {event.isPaid ? `₹${event.entryFee}` : 'Free'}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Participants</p>
              <p className="font-semibold text-white text-sm sm:text-base">
                {event.participantCount || 0}
                {event.maxParticipants && ` / ${event.maxParticipants}`}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Registration Deadline</p>
              <p className="font-semibold text-white text-sm sm:text-base">
                {new Date(event.registrationDeadline).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">About This Event</h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Registration Section */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.includes('Success') || message.includes('🎉') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div>
            {!currentUser ? (
              <button onClick={() => navigate('/login')} className="btn-primary w-full text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6">
                Login to Register
              </button>
            ) : !isRegistrationOpen() ? (
              <button disabled className="w-full bg-red-500 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg cursor-not-allowed text-sm sm:text-base">
                🔒 Registration Closed
              </button>
            ) : isRegistered ? (
              <button disabled className="w-full bg-green-500 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base">
                ✓ Already Registered
              </button>
            ) : userRole === 'student' ? (
              <button
                onClick={openRegistrationModal}
                className="btn-primary w-full text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6"
              >
                Register for this Event
              </button>
            ) : (
              <div className="text-center text-gray-400">
                Only students can register for events
              </div>
            )}
          </div>
        </div>

        {/* Payment Step Modal */}
        {showPaymentStep && event.isPaid && event.paymentConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="glass-container max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 glass-container border-b border-white/10 p-4 sm:p-6 flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    Payment - {event.eventName}
                  </h2>
                  <div className="mt-2">
                    {couponApplied && appliedCoupon ? (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400 line-through">Original: ₹{originalAmount}</p>
                        <p className="text-base sm:text-lg md:text-xl font-semibold text-green-400">
                          Final Amount: ₹{finalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-green-400">
                          🎊 {appliedCoupon.discountPercent}% discount applied - You save ₹{appliedCoupon.discountAmount.toFixed(2)}!
                        </p>
                      </div>
                    ) : (
                      <p className="text-base sm:text-lg md:text-xl font-semibold text-primary mt-1">
                        Amount: ₹{originalAmount}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentStep(false);
                    setShowRegistrationModal(true);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-6">
                {/* Coupon Section - Show if coupons are enabled */}
                {event.coupon && event.coupon.enabled && !couponApplied && (
                  <div className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-purple-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                      🎟️ Have a Discount Coupon?
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        className="input-field flex-1 text-sm sm:text-base"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="btn-primary whitespace-nowrap py-2 px-4 sm:px-6 text-sm sm:text-base"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 mt-2">{couponError}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Get {event.coupon.discountPercent}% off with the right code!
                    </p>
                  </div>
                )}

                {/* Show applied coupon with remove option */}
                {couponApplied && appliedCoupon && (
                  <div className="mb-4 sm:mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 flex items-center text-sm sm:text-base">
                          ✅ Coupon Applied: {appliedCoupon.code}
                        </h3>
                        <p className="text-xs sm:text-sm text-green-800 mt-1">
                          {appliedCoupon.discountPercent}% discount - You save ₹{appliedCoupon.discountAmount.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                
                {message && (
                  <div className={`mb-4 p-4 rounded-lg ${
                    message.includes('Success') || message.includes('🎉') || message.includes('save') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {message}
                  </div>
                )}

                {/* Manual QR Payment */}
                {event.paymentConfig.method === 'manual' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                      <h3 className="font-semibold text-blue-300 mb-2 text-sm sm:text-base">Payment Instructions</h3>
                      <p className="text-blue-200 whitespace-pre-line text-xs sm:text-sm">
                        {event.paymentConfig.instructions}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <div className="border-2 border-white/10 rounded-lg p-2 sm:p-4">
                        <img
                          src={event.paymentConfig.qrImageURL}
                          alt="Payment QR Code"
                          className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 sm:pt-6">
                      <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Upload Payment Proof</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="label">
                            Payment Screenshot <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="input-field"
                            required
                          />
                          {paymentScreenshotPreview && (
                            <div className="mt-3 sm:mt-4">
                              <img
                                src={paymentScreenshotPreview}
                                alt="Screenshot preview"
                                className="w-full h-32 sm:h-40 md:h-48 object-contain border rounded-lg"
                              />
                            </div>
                          )}
                          <p className="text-sm text-gray-400 mt-1">
                            Upload screenshot of your payment (Max 5MB)
                          </p>
                        </div>

                        <div>
                          <label className="label">
                            Transaction ID / UTR Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Enter transaction ID from payment"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                      <button
                        onClick={handleFinalSubmit}
                        disabled={!paymentScreenshot || !transactionId.trim() || uploadingScreenshot || registering}
                        className="btn-primary flex-1 disabled:opacity-50 py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base"
                      >
                        {registering ? 'Submitting...' : uploadingScreenshot ? 'Processing...' : 'Confirm & Register'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPaymentStep(false);
                          setShowRegistrationModal(true);
                        }}
                        className="btn-secondary flex-1 py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base"
                        disabled={registering}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Razorpay Payment */}
                {event.paymentConfig.method === 'razorpay' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                      <h3 className="font-semibold text-blue-300 mb-2 text-sm sm:text-base">Razorpay Payment</h3>
                      <p className="text-blue-200 text-xs sm:text-sm">
                        You will be redirected to Razorpay to complete the payment securely.
                      </p>
                    </div>

                    <div className="text-center py-6 sm:py-8">
                      <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                        Click the button below to proceed with payment of <strong className="text-lg sm:text-xl">₹{event.entryFee}</strong>
                      </p>
                      <button
                        onClick={handleRazorpayPayment}
                        disabled={processingRazorpay || registering}
                        className="btn-primary disabled:opacity-50 py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base"
                      >
                        {processingRazorpay ? 'Loading...' : 'Pay with Razorpay'}
                      </button>
                      <p className="text-sm text-gray-400 mt-4">
                        Secure payment powered by Razorpay
                      </p>
                    </div>

                    <div className="flex pt-4">
                      <button
                        onClick={() => {
                          setShowPaymentStep(false);
                          setShowRegistrationModal(true);
                        }}
                        className="btn-secondary w-full py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base"
                        disabled={processingRazorpay || registering}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="glass-container max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 glass-container border-b border-white/10 p-4 sm:p-6 flex justify-between items-start">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white pr-2">
                  Registration Form - {event.eventName}
                </h2>
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegistrationFormSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {event.prefillUserData && (
                  <div className="space-y-3 sm:space-y-4 pb-4 border-b border-white/10">
                    <h3 className="font-semibold text-white text-sm sm:text-base">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => handleFormChange(e, 'name')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleFormChange(e, 'email')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Phone <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleFormChange(e, 'phone')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">College <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.college || ''}
                          onChange={(e) => handleFormChange(e, 'college')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Branch</label>
                        <input
                          type="text"
                          value={formData.branch || ''}
                          onChange={(e) => handleFormChange(e, 'branch')}
                          className="input-field"
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div>
                        <label className="label">Year</label>
                        <select
                          value={formData.year || ''}
                          onChange={(e) => handleFormChange(e, 'year')}
                          className="input-field"
                        >
                          <option value="">Select Year</option>
                          <option>1st Year</option>
                          <option>2nd Year</option>
                          <option>3rd Year</option>
                          <option>4th Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Gender</label>
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => handleFormChange(e, 'gender')}
                          className="input-field"
                        >
                          <option value="">Select Gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                          <option>Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                {event.registrationForm && event.registrationForm.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold text-white text-sm sm:text-base">Additional Information</h3>
                    
                    {event.registrationForm.map((field) => (
                      <div key={field.id}>
                        <label className="label">
                          {field.label}
                          {field.required && <span className="text-red-500"> *</span>}
                        </label>

                        {['text', 'email', 'phone', 'number'].includes(field.type) && (
                          <input
                            type={field.type}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            rows="4"
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'dropdown' && (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        )}

                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {field.options?.map((option, idx) => (
                              <label key={idx} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`field-${field.id}`}
                                  value={option}
                                  checked={formData[field.id] === option}
                                  onChange={(e) => handleFormChange(e, field.id)}
                                  required={field.required}
                                  className="w-4 h-4"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {field.type === 'checkbox' && (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData[field.id] || false}
                              onChange={(e) => handleFormChange(e, field.id)}
                              required={field.required}
                              className="w-4 h-4"
                            />
                            <span>{field.placeholder || 'I agree'}</span>
                          </label>
                        )}

                        {field.type === 'file' && (
                          <input
                            type="file"
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    type="submit"
                    disabled={registering}
                    className="btn-primary flex-1 py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base"
                  >
                    {registering ? 'Submitting...' : (event.isPaid ? 'Proceed to Payment' : 'Submit Registration')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegistrationModal(false)}
                    className="btn-secondary flex-1 py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/fest/${event.festId}`)}
          className="btn-secondary text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4"
        >
          ← Back to Fest
        </button>
      </div>
    </div>
  );
};

export default EventDetails;
