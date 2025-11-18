/**
 * Formats a date string into 'DD MMM YYYY' format.
 * e.g., '13 Nov 2025'
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a date string into a detailed format with time.
 * e.g., '13-November-2025 05:30 PM'
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date and time string.
 */
export const formatFullDateTime = (dateString, short = false) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', {
    month: short ? 'short' : 'long',
  });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${day}-${month}-${year} ${time}`;
};

/**
 * Converts a Date object to a 'YYYY-MM-DD' string.
 * @param {Date} date - The date object.
 * @returns {string} The formatted date string.
 */
export const toYYYYMMDD = date => {
  if (!(date instanceof Date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a time string 'HH:MM' to total minutes from midnight.
 * @param {string} timeString - The time string.
 * @returns {number} The total minutes.
 */
export const timeToMinutes = timeString => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};
