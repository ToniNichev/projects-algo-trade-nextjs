// lib/dateHelper.js

// Private helper function
const formatWithLeadingZero = value => value.toString().padStart(2, '0');

export const getPastHourFromDate = (date, hours) => {
  const newDate = new Date(date);
  newDate.setHours(date.getHours() - hours);
  return newDate;
};

export const getPastDateFromDate = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() - days);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const stringToDate = dateStr => {
  if (typeof dateStr !== 'string' || dateStr.length < 14) {
    throw new Error('Invalid date string format. Expected YYYYMMDDHHmmss');
  }
  
  return new Date(
    parseInt(dateStr.slice(0, 4)),    // Year
    parseInt(dateStr.slice(4, 6)) - 1, // Month
    parseInt(dateStr.slice(6, 8)),    // Day
    parseInt(dateStr.slice(8, 10)),   // Hours
    parseInt(dateStr.slice(10, 12)),  // Minutes
    parseInt(dateStr.slice(12, 14))   // Seconds
  );
};

export const dateToDateStr = date => {
  return [
    date.getFullYear(),
    formatWithLeadingZero(date.getMonth() + 1),
    formatWithLeadingZero(date.getDate()),
    formatWithLeadingZero(date.getHours()),
    formatWithLeadingZero(date.getMinutes()),
    formatWithLeadingZero(date.getSeconds()),
    formatWithLeadingZero(Math.round(date.getMilliseconds() / 10))
  ].join('');
};

export const getDateFromDateString = dateStr => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return [
    dateStr.slice(0, 4),
    months[parseInt(dateStr.slice(4, 6)) - 1],
    dateStr.slice(6, 8)
  ];
};

export const getMonthName = monthIndex => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return monthNames[monthIndex];
};

// Optional: Export as default object for backward compatibility
export default {
  getPastHourFromDate,
  getPastDateFromDate,
  stringToDate,
  dateToDateStr,
  getDateFromDateString,
  getMonthName
};