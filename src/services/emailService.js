import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Sends a confirmation email to the student after successful event registration
 * @param {Object} emailData - The email data containing student and event information
 * @returns {Promise<boolean>} - Returns true if email sent successfully, false otherwise
 */
export const sendRegistrationConfirmationEmail = async (emailData) => {
  // Check if EmailJS is configured
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS not configured. Skipping email notification.');
    return false;
  }

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
      to: emailData.studentEmail
    });

    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    if (response.status === 200) {
      console.log('✅ Confirmation email sent successfully to:', emailData.studentEmail);
      return true;
    } else {
      console.error('❌ Failed to send email. Status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    console.error('Error details:', {
      message: error.message,
      text: error.text,
      status: error.status
    });
    
    // Provide helpful error messages
    if (error.status === 422) {
      console.error('⚠️ Error 422: Template not found or invalid template variables.');
      console.error('Please check:');
      console.error('1. Template ID in .env matches your EmailJS template');
      console.error('2. All template variables are defined in EmailJS');
      console.error('3. Email service is properly connected in EmailJS dashboard');
    }
    
    return false;
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
