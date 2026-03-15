/**
 * Application-wide constants for Festify
 */

// Fest Categories
export const FEST_CATEGORIES = {
  TECHNICAL: 'Technical',
  CULTURAL: 'Cultural',
  SPORTS: 'Sports',
  BUSINESS: 'Business',
  LITERARY: 'Literary',
  ARTS: 'Arts',
};

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
};

// Metro Cities (commonly used)
export const METRO_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Surat',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
];

// Form Field Types
export const FORM_FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  NUMBER: 'number',
  PHONE: 'phone',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  DATE: 'date',
  FILE: 'file',
};

// File Upload Constraints
export const FILE_CONSTRAINTS = {
  IMAGE: {
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  DOCUMENT: {
    MAX_SIZE_MB: 10,
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx'],
  },
};

// Validation Constraints
export const VALIDATION_RULES = {
  FEST_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 2000,
  },
  COLLEGE_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  EVENT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  PHONE: {
    LENGTH: 10,
    PATTERN: /^[6-9]\d{9}$/,
  },
};

// Social Media Platforms
export const SOCIAL_MEDIA_PLATFORMS = {
  INSTAGRAM: {
    name: 'Instagram',
    icon: '📷',
    urlPattern: 'instagram.com',
  },
  LINKEDIN: {
    name: 'LinkedIn',
    icon: '💼',
    urlPattern: 'linkedin.com',
  },
  TWITTER: {
    name: 'Twitter',
    icon: '🐦',
    urlPattern: 'twitter.com',
  },
  FACEBOOK: {
    name: 'Facebook',
    icon: '👤',
    urlPattern: 'facebook.com',
  },
  YOUTUBE: {
    name: 'YouTube',
    icon: '📺',
    urlPattern: 'youtube.com',
  },
  WEBSITE: {
    name: 'Website',
    icon: '🌐',
    urlPattern: '',
  },
};

// Status Constants
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
};

// Toast/Notification Durations (in milliseconds)
export const NOTIFICATION_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
};

// API Response Messages
export const API_MESSAGES = {
  SUCCESS: {
    FEST_CREATED: 'Festival created successfully!',
    EVENT_CREATED: 'Event created successfully!',
    REGISTRATION_SUCCESS: 'Registration successful!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    DATA_SAVED: 'Data saved successfully!',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'Requested resource not found.',
    VALIDATION: 'Please check your input and try again.',
    FILE_UPLOAD: 'Failed to upload file. Please try again.',
  },
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  FULL: 'MMMM DD, YYYY HH:mm',
  TIME: 'HH:mm',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'festify_theme',
  USER_PREFERENCES: 'festify_user_preferences',
  LAST_VISITED: 'festify_last_visited',
  DRAFT_DATA: 'festify_draft',
};

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

// Animation Durations (in milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Breakpoints (matching Tailwind default)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Maximum values
export const MAX_VALUES = {
  SPONSORS: 20,
  GALLERY_IMAGES: 30,
  EVENTS_PER_FEST: 50,
  FORM_FIELDS: 30,
};

// Email Templates
export const EMAIL_TEMPLATES = {
  VERIFICATION: 'email_verification',
  REGISTRATION_CONFIRMATION: 'registration_confirmation',
  EVENT_REMINDER: 'event_reminder',
  PASSWORD_RESET: 'password_reset',
};

// Error Codes
export const ERROR_CODES = {
  AUTH_FAILED: 'AUTH/FAILED',
  EMAIL_NOT_VERIFIED: 'AUTH/EMAIL_NOT_VERIFIED',
  PERMISSION_DENIED: 'PERMISSION/DENIED',
  NOT_FOUND: 'RESOURCE/NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION/ERROR',
  NETWORK_ERROR: 'NETWORK/ERROR',
};

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_PAYMENT_GATEWAY: false,
  ENABLE_CHAT: false,
  ENABLE_NOTIFICATIONS: true,
};

export default {
  FEST_CATEGORIES,
  USER_ROLES,
  METRO_CITIES,
  FORM_FIELD_TYPES,
  FILE_CONSTRAINTS,
  VALIDATION_RULES,
  SOCIAL_MEDIA_PLATFORMS,
  EVENT_STATUS,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  PAGINATION,
  NOTIFICATION_DURATION,
  API_MESSAGES,
  DATE_FORMATS,
  STORAGE_KEYS,
  THEMES,
  ANIMATION,
  BREAKPOINTS,
  MAX_VALUES,
  EMAIL_TEMPLATES,
  ERROR_CODES,
  FEATURE_FLAGS,
};
