/**
 * Date and time formatting utilities for Festify application
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'full')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'long') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  return dateObj.toLocaleDateString('en-US', options[format] || options.long);
};

/**
 * Format time to readable string
 * @param {Date|string} time - Time to format
 * @param {boolean} includeSeconds - Whether to include seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (time, includeSeconds = false) => {
  if (!time) return '';
  
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  
  if (isNaN(timeObj.getTime())) return 'Invalid Time';
  
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  };
  
  return timeObj.toLocaleTimeString('en-US', options);
};

/**
 * Format date and time together
 * @param {Date|string} datetime - DateTime to format
 * @returns {string} - Formatted datetime string
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return '';
  
  const datetimeObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  if (isNaN(datetimeObj.getTime())) return 'Invalid DateTime';
  
  return `${formatDate(datetimeObj, 'long')} at ${formatTime(datetimeObj)}`;
};

/**
 * Get relative time (e.g., "2 days ago", "in 3 hours")
 * @param {Date|string} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = dateObj - now;
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  const isPast = diffMs < 0;
  const suffix = isPast ? 'ago' : 'from now';
  
  if (diffYear > 0) {
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffMonth > 0) {
    return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffWeek > 0) {
    return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ${suffix}`;
  }
  
  return isPast ? 'just now' : 'in a moment';
};

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  
  return dateObj < now;
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
};

/**
 * Check if date is tomorrow
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is tomorrow
 */
export const isTomorrow = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return dateObj.getDate() === tomorrow.getDate() &&
         dateObj.getMonth() === tomorrow.getMonth() &&
         dateObj.getFullYear() === tomorrow.getFullYear();
};

/**
 * Get days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} - Number of days between dates
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get countdown to a date
 * @param {Date|string} targetDate - Target date
 * @returns {Object} - Object with days, hours, minutes, seconds
 */
export const getCountdown = (targetDate) => {
  if (!targetDate) return null;
  
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diffMs = target - now;
  
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, isExpired: false };
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format timestamp to readable string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return formatDateTime(date);
};

/**
 * Get day name from date
 * @param {Date|string} date - Date
 * @returns {string} - Day name (e.g., "Monday")
 */
export const getDayName = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Get month name from date
 * @param {Date|string} date - Date
 * @returns {string} - Month name (e.g., "January")
 */
export const getMonthName = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-US', { month: 'long' });
};

/**
 * Check if registration is open based on dates
 * @param {Date|string} startDate - Registration start date
 * @param {Date|string} endDate - Registration end date
 * @returns {Object} - Status object
 */
export const getRegistrationStatus = (startDate, endDate) => {
  const now = new Date();
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (now < start) {
    return {
      isOpen: false,
      status: 'not_started',
      message: `Registration opens ${getRelativeTime(start)}`
    };
  }
  
  if (now > end) {
    return {
      isOpen: false,
      status: 'closed',
      message: 'Registration closed'
    };
  }
  
  return {
    isOpen: true,
    status: 'open',
    message: `Registration closes ${getRelativeTime(end)}`
  };
};

/**
 * Add days to a date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export const addDays = (date, days) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTime,
  isPastDate,
  isToday,
  isTomorrow,
  getDaysBetween,
  getCountdown,
  formatDateForInput,
  formatTimestamp,
  getDayName,
  getMonthName,
  getRegistrationStatus,
  addDays,
};
