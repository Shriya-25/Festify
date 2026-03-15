/**
 * Accessibility utilities for Festify application
 * Provides helper functions and constants for improving accessibility
 */

/**
 * Generates accessible error messages for form fields
 * @param {string} fieldName - Name of the field
 * @param {string} error - Error message
 * @returns {string} - Accessible error ID
 */
export const getErrorId = (fieldName) => {
  return `${fieldName}-error`;
};

/**
 * Generates accessible description ID for form fields
 * @param {string} fieldName - Name of the field
 * @returns {string} - Accessible description ID
 */
export const getDescriptionId = (fieldName) => {
  return `${fieldName}-description`;
};

/**
 * ARIA live region announcer for screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Keyboard navigation helper for custom components
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Function} onEnter - Callback for Enter key
 * @param {Function} onSpace - Callback for Space key
 * @param {Function} onEscape - Callback for Escape key
 */
export const handleKeyboardNavigation = (event, { onEnter, onSpace, onEscape }) => {
  switch (event.key) {
    case 'Enter':
      if (onEnter) {
        event.preventDefault();
        onEnter(event);
      }
      break;
    case ' ':
      if (onSpace) {
        event.preventDefault();
        onSpace(event);
      }
      break;
    case 'Escape':
      if (onEscape) {
        event.preventDefault();
        onEscape(event);
      }
      break;
    default:
      break;
  }
};

/**
 * Creates accessible button props
 * @param {string} label - Button label
 * @param {boolean} isPressed - Whether button is pressed (for toggle buttons)
 * @param {boolean} isDisabled - Whether button is disabled
 * @returns {object} - Accessible props
 */
export const getAccessibleButtonProps = (label, isPressed = null, isDisabled = false) => {
  const props = {
    'aria-label': label,
    'aria-disabled': isDisabled,
  };
  
  if (isPressed !== null) {
    props['aria-pressed'] = isPressed;
  }
  
  return props;
};

/**
 * Creates accessible form field props
 * @param {string} fieldName - Field name
 * @param {boolean} isRequired - Whether field is required
 * @param {string} error - Error message if any
 * @param {string} description - Field description
 * @returns {object} - Accessible props
 */
export const getAccessibleFieldProps = (fieldName, isRequired = false, error = null, description = null) => {
  const props = {
    id: fieldName,
    name: fieldName,
    'aria-required': isRequired,
    'aria-invalid': !!error,
  };
  
  const describedBy = [];
  
  if (error) {
    describedBy.push(getErrorId(fieldName));
  }
  
  if (description) {
    describedBy.push(getDescriptionId(fieldName));
  }
  
  if (describedBy.length > 0) {
    props['aria-describedby'] = describedBy.join(' ');
  }
  
  return props;
};

/**
 * Focus trap for modals and dialogs
 * @param {HTMLElement} element - Container element
 */
export const trapFocus = (element) => {
  if (!element) return;
  
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (event) => {
    if (event.key !== 'Tab') return;
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Skip to main content link helper
 * @param {string} mainContentId - ID of main content element
 */
export const skipToMainContent = (mainContentId = 'main-content') => {
  const mainContent = document.getElementById(mainContentId);
  if (mainContent) {
    mainContent.focus();
    mainContent.scrollIntoView();
  }
};

/**
 * Common ARIA labels and descriptions
 */
export const ARIA_LABELS = {
  close: 'Close',
  menu: 'Menu',
  search: 'Search',
  navigation: 'Main navigation',
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
  required: 'Required field',
  optional: 'Optional field',
};

/**
 * Color contrast checker (WCAG AA compliance)
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {boolean} - Whether contrast is sufficient
 */
export const hasGoodContrast = (foreground, background) => {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const getLuminance = (color) => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  // WCAG AA requires 4.5:1 for normal text
  return ratio >= 4.5;
};
