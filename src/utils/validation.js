/**
 * Form validation utilities for Festify application
 */

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid or empty
 */
export const isValidUrl = (url) => {
  if (!url || url.trim() === '') return true; // Empty is valid (optional fields)
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Validates phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates date is not in the past
 * @param {string} date - Date to validate (YYYY-MM-DD)
 * @returns {boolean} - True if valid
 */
export const isNotPastDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

/**
 * Validates end date is after start date
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} - True if valid
 */
export const isEndDateAfterStart = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(endDate) >= new Date(startDate);
};

/**
 * Validates required field is not empty
 * @param {string} value - Value to validate
 * @returns {boolean} - True if not empty
 */
export const isRequired = (value) => {
  return value && value.trim().length > 0;
};

/**
 * Validates minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} - True if meets minimum
 */
export const hasMinLength = (value, minLength) => {
  return value && value.trim().length >= minLength;
};

/**
 * Validates maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if within maximum
 */
export const hasMaxLength = (value, maxLength) => {
  return !value || value.trim().length <= maxLength;
};

/**
 * Validates file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - True if within size limit
 */
export const isValidFileSize = (file, maxSizeMB = 5) => {
  if (!file) return false;
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Validates file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {boolean} - True if type is allowed
 */
export const isValidFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) => {
  if (!file) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates fest creation form
 * @param {object} festData - Fest data to validate
 * @returns {object} - Validation result with isValid and errors
 */
export const validateFestForm = (festData) => {
  const errors = {};
  
  if (!isRequired(festData.festName)) {
    errors.festName = 'Fest name is required';
  } else if (!hasMinLength(festData.festName, 3)) {
    errors.festName = 'Fest name must be at least 3 characters';
  } else if (!hasMaxLength(festData.festName, 100)) {
    errors.festName = 'Fest name must not exceed 100 characters';
  }

  if (!isRequired(festData.collegeName)) {
    errors.collegeName = 'College name is required';
  }

  if (!isRequired(festData.city)) {
    errors.city = 'City is required';
  }

  if (!isRequired(festData.description)) {
    errors.description = 'Description is required';
  } else if (!hasMinLength(festData.description, 20)) {
    errors.description = 'Description must be at least 20 characters';
  }

  if (!isRequired(festData.festStartDate)) {
    errors.festStartDate = 'Fest start date is required';
  } else if (!isNotPastDate(festData.festStartDate)) {
    errors.festStartDate = 'Fest start date cannot be in the past';
  }

  if (!isRequired(festData.registrationStartDate)) {
    errors.registrationStartDate = 'Registration start date is required';
  }

  if (!isRequired(festData.registrationEndDate)) {
    errors.registrationEndDate = 'Registration end date is required';
  }

  if (festData.registrationStartDate && festData.registrationEndDate) {
    if (!isEndDateAfterStart(festData.registrationStartDate, festData.registrationEndDate)) {
      errors.registrationEndDate = 'Registration end date must be after start date';
    }
  }

  if (festData.socialMedia) {
    Object.keys(festData.socialMedia).forEach((key) => {
      if (festData.socialMedia[key] && !isValidUrl(festData.socialMedia[key])) {
        errors[`socialMedia_${key}`] = `Invalid ${key} URL`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
