import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { sendRegistrationConfirmationEmail, formatCustomFieldsForEmail, formatContactsForEmail } from '../services/emailService';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const EventDetails = () => {
  const { eventId } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [fest, setFest] = useState(null);
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

        // Fetch fest details for social media
        if (eventData.festId) {
          const festDoc = await getDoc(doc(db, 'fests', eventData.festId));
          if (festDoc.exists()) {
            setFest({ id: festDoc.id, ...festDoc.data() });
          }
        }
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
      
      // Send confirmation email to the student
      try {
        const emailData = {
          studentEmail: registrationData.email || currentUser.email,
          studentName: registrationData.name || currentUser.displayName || 'Student',
          studentPhone: registrationData.phone || 'N/A',
          studentCollege: registrationData.college || 'N/A',
          studentBranch: registrationData.branch || 'N/A',
          studentYear: registrationData.year || 'N/A',
          studentGender: registrationData.gender || 'N/A',
          eventName: event.eventName,
          festName: event.festName,
          eventDate: new Date(event.date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          eventTime: event.time,
          eventVenue: event.venue,
          registrationDate: new Date().toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          }),
          customFields: registrationData.customFields ? formatCustomFieldsForEmail(registrationData.customFields) : 'None',
          paymentStatus: event.isPaid 
            ? (event.paymentConfig.method === 'manual' 
                ? `Pending Verification - ₹${finalAmount}` 
                : `Paid - ₹${finalAmount}`)
            : 'Free Event',
          paymentAmount: event.isPaid ? `₹${finalAmount}` : 'Free',
          organizerContacts: event.contacts ? formatContactsForEmail(event.contacts) : 'Will be provided soon',
        };

        const emailSent = await sendRegistrationConfirmationEmail(emailData);
        if (emailSent) {
          console.log('✅ Confirmation email sent successfully');
        } else {
          console.warn('⚠️ Registration successful but email was not sent');
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send confirmation email:', emailError);
        // Don't fail the registration if email fails
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const registrationStatus = !isRegistrationOpen() ? 'closed' : isRegistered ? 'registered' : 'open';

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20 pt-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Images, Prize Pool, Rules, Contact) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Event Image Card */}
            <div className="bg-surface-card rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg">
                <div className="aspect-video w-full relative">
                    {event.bannerUrl ? (
                        <img 
                        src={event.bannerUrl} 
                        alt={event.eventName}
                        className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-surface-dark flex items-center justify-center">
                            <span className="text-gray-400 font-bold text-xl">NO IMAGE</span>
                        </div>
                    )}
                    
                    {/* Status Badge Overlay */}
                    <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${
                            !isRegistrationOpen() 
                            ? 'bg-red-500/80 text-white border-red-500/30'
                            : isRegistered
                            ? 'bg-green-500/80 text-white border-green-500/30'
                            : 'bg-green-500/80 text-white border-green-500' 
                        }`}>
                            {!isRegistrationOpen() ? 'Closed' : isRegistered ? 'Registered' : 'Open'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Prize Pool Card */}
            <div className="bg-surface-card rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-lg">
                <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-4">
                    <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
                    PRIZE POOL
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                        <span className="text-text-secondary text-sm">Winner</span>
                        <span className="text-yellow-500 font-bold">
                            {event.prizePool ? `₹${event.prizePool.winner}` : 'TBA'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                        <span className="text-text-secondary text-sm">Runner Up</span>
                        <span className="text-text-primary font-bold">
                             {event.prizePool ? `₹${event.prizePool.runnerUp}` : 'TBA'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Rules & Guidelines Card */}
            <div className="bg-surface-card rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-lg">
                 <h3 className="text-lg font-bold text-text-primary mb-4">Rules and Guidelines</h3>
                 <div className="text-text-secondary text-sm space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {event.rules ? (
                        <p className="whitespace-pre-line">{event.rules}</p>
                    ) : (
                        <p>General rules apply. Please contact organizers for specific guidelines.</p>
                    )}
                 </div>
                 {event.rules && event.rules.length > 150 && (
                     <button className="text-primary text-sm font-bold mt-2 hover:underline">Read More</button>
                 )}
            </div>

            {/* Contact Details Card */}
            <div className="bg-surface-card rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-lg">
                <h3 className="text-lg font-bold text-text-primary mb-4">Contact Details</h3>
                <div className="space-y-4">
                    {event.contacts && event.contacts.length > 0 ? (
                        event.contacts.map((contact, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{contact.name}</p>
                                    <a href={`tel:${contact.phone}`} className="text-xs text-text-secondary mt-0.5 hover:text-primary transition-colors">{contact.phone}</a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-start gap-3">
                             <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <span className="material-symbols-outlined text-sm">support_agent</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">Event Organizer</p>
                                <p className="text-xs text-text-secondary mt-0.5">Contact info TBA</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

          </div>

          {/* Right Column (Header, Description, Register) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header & Registration Card */}
            <div className="bg-surface-card rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-lg relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                <div className="mb-2">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider bg-primary/10 px-2 py-1 rounded inline-block mb-2">{event.domain || 'Event'}</span>
                    <h1 className="text-3xl md:text-5xl font-black text-text-primary mb-2">{event.eventName}</h1>
                    <p className="text-text-secondary text-lg flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">festival</span>
                       {event.festName}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 bg-background/50 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-card rounded-lg text-primary border border-gray-200 dark:border-white/10">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary uppercase tracking-wide">Date</p>
                            <p className="text-text-primary font-bold text-sm">
                                {new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-card rounded-lg text-accent-pink border border-gray-200 dark:border-white/10">
                            <span className="material-symbols-outlined">location_on</span>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary uppercase tracking-wide">Venue</p>
                            <p className="text-text-primary font-bold text-sm">{event.venue}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-card rounded-lg text-green-500 border border-gray-200 dark:border-white/10">
                             <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary uppercase tracking-wide">Entry Fee</p>
                            <p className="text-text-primary font-bold text-lg">
                                {event.isPaid ? `₹${event.entryFee}` : 'Free'}
                            </p>
                        </div>
                     </div>
                </div>

                {isRegistrationOpen() ? (
                    currentUser ? (
                         isRegistered ? (
                            <button disabled className="w-full py-4 bg-green-500/10 text-green-600 font-bold rounded-xl border border-green-500/20 cursor-not-allowed flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">check_circle</span>
                                Already Registered
                            </button>
                         ) : userRole === 'student' ? (
                            <button 
                                onClick={openRegistrationModal}
                                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl shadow-glow-primary transition-all active:scale-[0.98]"
                            >
                                Register Now
                            </button>
                         ) : (
                            <div className="text-center p-3 bg-background/50 rounded-lg text-text-secondary text-sm border border-gray-200 dark:border-white/10">
                                Only students can register for events
                            </div>
                         )
                    ) : (
                        <button 
                            onClick={() => navigate('/login', { state: { from: `/event/${eventId}` } })}
                            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl shadow-glow-primary transition-all active:scale-[0.98]"
                        >
                            Login to Register
                        </button>
                    )
                ) : (
                    <button disabled className="w-full py-4 bg-background/50 text-text-secondary font-bold rounded-xl border border-gray-200 dark:border-white/10 cursor-not-allowed">
                        Registration Closed
                    </button>
                )}
            </div>

            {/* Description / Rounds Card */}
            <div className="bg-surface-card rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-lg">
                <div className="border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-text-primary">
                        {event.eventName} <span className="text-primary">Details</span>
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">Competition details and information</p>
                </div>
                
                <div className="prose prose-invert max-w-none text-text-secondary dark:text-gray-300">
                    <h3 className="text-text-primary font-bold mb-2">All that you need to know about {event.eventName}</h3>
                    <p className="whitespace-pre-line leading-relaxed text-sm md:text-base">
                        {event.description}
                    </p>
                </div>
                
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/fest/${event.festId}`)}
                    className="mt-8 text-text-secondary hover:text-primary flex items-center gap-2 transition-colors text-sm"
                    >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Fest
                </button>
            </div>

          </div>
        </div>
      </div>

      {/* Payment Step Modal */}
      {showPaymentStep && event.isPaid && event.paymentConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
          <div className="glass-container max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/20 shadow-2xl bg-surface-card">
            <div className="sticky top-0 bg-surface-card/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Complete Payment</h2>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-text-secondary">Total Amount:</span>
                  <span className="text-primary font-bold text-lg">
                    ₹{finalAmount.toFixed(2)}
                  </span>
                   {couponApplied && (
                     <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                       Code {appliedCoupon.code} applied
                     </span>
                   )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaymentStep(false);
                  setShowRegistrationModal(true);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background/50 hover:bg-red-500/20 hover:text-red-400 transition-colors text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Coupon Section */}
              {event.coupon && event.coupon.enabled && !couponApplied && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30">
                  <h3 className="text-sm font-semibold text-purple-200 mb-3 flex items-center gap-2">
                    🎟️ Have a Discount Coupon?
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input-field py-2 text-sm"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
                </div>
              )}

              {/* Manual QR Payment */}
              {event.paymentConfig.method === 'manual' && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-background/50 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="mx-auto w-48 h-48 bg-white p-2 rounded-lg mb-4">
                      <img
                        src={event.paymentConfig.qrImageURL}
                        alt="Payment QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-blue-500 dark:text-blue-200 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 inline-block">
                      Scan to pay ₹{finalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-white/10 pt-6 space-y-4">
                    <h3 className="font-semibold text-text-primary">Upload Payment Proof</h3>
                    
                    <div>
                      <label className="label">Transaction ID / UTR <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter 12-digit UTR number"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Screenshot <span className="text-red-500">*</span></label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-background/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                           {paymentScreenshotPreview ? (
                             <img src={paymentScreenshotPreview} className="h-28 object-contain" alt="Preview"/>
                           ) : (
                             <>
                               <svg className="w-8 h-8 mb-3 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                               <p className="mb-2 text-sm text-text-secondary"><span className="font-semibold">Click to upload</span> payment screenshot</p>
                             </>
                           )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleScreenshotChange} required />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleFinalSubmit}
                    disabled={!paymentScreenshot || !transactionId.trim() || uploadingScreenshot || registering}
                    className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? 'Verifying...' : uploadingScreenshot ? 'Uploading Proof...' : 'Submit Payment Proof'}
                  </button>
                </div>
              )}

              {/* Razorpay Payment */}
              {event.paymentConfig.method === 'razorpay' && (
                <div className="text-center space-y-6 py-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-blue-500 dark:text-blue-300">Secure Payment Gateway</p>
                  </div>
                  <button
                    onClick={handleRazorpayPayment}
                    disabled={processingRazorpay || registering}
                    className="btn-primary w-full py-4 text-lg shadow-[0_0_20px_rgba(255,122,24,0.3)]"
                  >
                    {processingRazorpay ? 'Processing...' : `Pay ₹${finalAmount.toFixed(2)} Securely`}
                  </button>
                  <p className="text-xs text-text-secondary uppercase tracking-widest">Powered by Razorpay</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
          <div className="glass-container max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/20 shadow-2xl bg-surface-card">
            <div className="sticky top-0 bg-surface-card/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-text-primary">Event Registration</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background/50 hover:bg-background/80 transition-colors text-text-secondary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegistrationFormSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              {event.prefillUserData && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Participant Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="label text-xs">Full Name</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleFormChange(e, 'name')}
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="label text-xs">Email Address</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleFormChange(e, 'email')}
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="label text-xs">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleFormChange(e, 'phone')}
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="label text-xs">College Name</label>
                      <input
                        type="text"
                        value={formData.college || ''}
                        onChange={(e) => handleFormChange(e, 'college')}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Custom Fields */}
              {event.registrationForm && event.registrationForm.length > 0 && (
                <div className="space-y-4 border-t border-white/10 pt-6">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Additional Information</h3>
                  
                  {event.registrationForm.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="label text-xs">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
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

                      {field.type === 'textarea' && (
                        <textarea
                          value={formData[field.id] || ''}
                          onChange={(e) => handleFormChange(e, field.id)}
                          placeholder={field.placeholder}
                          rows="3"
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
                          <option value="">Select option</option>
                          {field.options?.map((option, idx) => (
                            <option key={idx} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === 'radio' && (
                          <div className="flex flex-wrap gap-4 mt-2">
                            {field.options?.map((option, idx) => (
                              <label key={idx} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`field-${field.id}`}
                                  value={option}
                                  checked={formData[field.id] === option}
                                  onChange={(e) => handleFormChange(e, field.id)}
                                  required={field.required}
                                  className="form-radio text-primary focus:ring-primary bg-white/10 border-white/20"
                                />
                                <span className="text-sm text-gray-300">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {field.type === 'checkbox' && (
                          <label className="flex items-center space-x-2 mt-2 cursor-pointer p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData[field.id] || false}
                              onChange={(e) => handleFormChange(e, field.id)}
                              required={field.required}
                              className="w-5 h-5 rounded text-primary border-gray-500 focus:ring-primary bg-transparent"
                            />
                            <span className="text-sm text-gray-200">{field.placeholder || 'I Confirm'}</span>
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

              <div className="pt-6 border-t border-white/10 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowRegistrationModal(false)}
                  className="flex-1 btn-secondary py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 btn-primary py-3 text-sm font-bold shadow-lg shadow-primary/20"
                >
                  {registering ? 'Processing...' : (event.isPaid ? 'Proceed to Payment →' : 'Confirm Registration')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
