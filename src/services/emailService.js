import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Email service constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds
const EMAIL_TIMEOUT = 10000; // 10 seconds

// Rate limiting
let lastEmailSent = 0;
const MIN_EMAIL_INTERVAL = 1000; // 1 second between emails

/**
 * Delays execution for a specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks if EmailJS is properly configured
 * @returns {boolean} - True if configured
 */
const isEmailJSConfigured = () => {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};

/**
 * Rate limiting check
 * @returns {Promise<void>} - Resolves when safe to send
 */
const checkRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastEmail = now - lastEmailSent;
  
  if (timeSinceLastEmail < MIN_EMAIL_INTERVAL) {
    const waitTime = MIN_EMAIL_INTERVAL - timeSinceLastEmail;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms before sending email`);
    await delay(waitTime);
  }
  
  lastEmailSent = Date.now();
};

/**
 * Validates email data before sending
 * @param {Object} emailData - Email data to validate
 * @returns {Object} - Validation result
 */
const validateEmailData = (emailData) => {
  const errors = [];
  
  if (!emailData.studentEmail || !emailData.studentEmail.includes('@')) {
    errors.push('Invalid student email address');
  }
  
  if (!emailData.studentName || emailData.studentName.trim().length === 0) {
    errors.push('Student name is required');
  }
  
  if (!emailData.eventName) {
    errors.push('Event name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sends a confirmation email to the student after successful event registration
 * @param {Object} emailData - The email data containing student and event information
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Object>} - Returns result object with success status and message
 */
export const sendRegistrationConfirmationEmail = async (emailData, retryCount = 0) => {
  // Check if EmailJS is configured
  if (!isEmailJSConfigured()) {
    console.warn('⚠️ EmailJS not configured. Skipping email notification.');
    return {
      success: false,
      error: 'EMAIL_NOT_CONFIGURED',
      message: 'Email service is not configured'
    };
  }

  // Validate email data
  const validation = validateEmailData(emailData);
  if (!validation.isValid) {
    console.error('❌ Email data validation failed:', validation.errors);
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: validation.errors.join(', ')
    };
  }

  // Apply rate limiting
  await checkRateLimit();

  try {
    // Prepare the email template parameters
    const templateParams = {
      to_email: emailData.studentEmail,
      to_name: emailData.studentName,
      event_name: emailData.eventName,
      fest_name: emailData.festName,
      event_date: emailData.eventDate,
      event_time: emailData.eventTime,
      event_venue: emailData.eventVenue,
      student_name: emailData.studentName,
      student_email: emailData.studentEmail,
      student_phone: emailData.studentPhone,
      student_college: emailData.studentCollege,
      student_branch: emailData.studentBranch || 'N/A',
      student_year: emailData.studentYear || 'N/A',
      student_gender: emailData.studentGender || 'N/A',
      registration_date: emailData.registrationDate,
      custom_fields: emailData.customFields || 'None',
      payment_status: emailData.paymentStatus || 'Free Event',
      payment_amount: emailData.paymentAmount || '0',
      organizer_contacts: emailData.organizerContacts || 'Will be provided soon',
    };

    console.log('🔄 Sending email with config:', {
      service: EMAILJS_SERVICE_ID,
      template: EMAILJS_TEMPLATE_ID,
      to: emailData.studentEmail,
      attempt: retryCount + 1
    });

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout')), EMAIL_TIMEOUT)
    );

    // Send email using EmailJS with timeout
    const response = await Promise.race([
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      ),
      timeoutPromise
    ]);

    if (response.status === 200) {
      console.log('✅ Confirmation email sent successfully to:', emailData.studentEmail);
      return {
        success: true,
        message: 'Email sent successfully'
      };
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    
    // Detailed error logging
    if (error.message === 'Email timeout') {
      console.error('⏱️ Email request timed out');
    } else {
      console.error('Error details:', {
        message: error.message,
        text: error.text,
        status: error.status
      });
    }
    
    // Provide helpful error messages based on status
    if (error.status === 422) {
      console.error('⚠️ Error 422: Template not found or invalid template variables.');
      console.error('Please check:');
      console.error('1. Template ID in .env matches your EmailJS template');
      console.error('2. All template variables are defined in EmailJS');
      console.error('3. Email service is properly connected in EmailJS dashboard');
      
      return {
        success: false,
        error: 'TEMPLATE_ERROR',
        message: 'Email template configuration error'
      };
    }
    
    if (error.status === 403) {
      console.error('⚠️ Error 403: Authentication failed or quota exceeded');
      return {
        success: false,
        error: 'AUTH_ERROR',
        message: 'Email authentication failed or quota exceeded'
      };
    }
    
    // Retry logic for network errors
    if (retryCount < MAX_RETRY_ATTEMPTS && 
        (error.message === 'Email timeout' || 
         error.message.includes('network') || 
         error.status >= 500)) {
      console.log(`🔄 Retrying email send (attempt ${retryCount + 2}/${MAX_RETRY_ATTEMPTS + 1})...`);
      await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return sendRegistrationConfirmationEmail(emailData, retryCount + 1);
    }
    
    return {
      success: false,
      error: error.status || 'UNKNOWN_ERROR',
      message: error.message || 'Failed to send email'
    };
  }
};

/**
 * Formats custom fields object into a readable string for email
 * @param {Object} customFields - Custom field responses
 * @returns {string} - Formatted string
 */
export const formatCustomFieldsForEmail = (customFields) => {
  if (!customFields || Object.keys(customFields).length === 0) {
    return 'None';
  }

  return Object.entries(customFields)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
};

/**
 * Formats organizer contacts into a readable string for email
 * @param {Array} contacts - Array of contact objects
 * @returns {string} - Formatted string
 */
export const formatContactsForEmail = (contacts) => {
  if (!contacts || contacts.length === 0) {
    return 'Will be provided soon';
  }

  return contacts
    .map((contact) => {
      let contactStr = `${contact.name} - ${contact.phone}`;
      if (contact.email) contactStr += ` (${contact.email})`;
      if (contact.description) contactStr += ` - ${contact.description}`;
      return contactStr;
    })
    .join('\n');
};
