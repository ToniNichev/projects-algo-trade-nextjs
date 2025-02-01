
// useDateHelper.js
export const useDateHelper = () => {
    const stringToDate = (dateStr) => {
      const yy = parseInt(dateStr.slice(0, 4), 10);
      const mm = parseInt(dateStr.slice(4, 6), 10) - 1;
      const dd = parseInt(dateStr.slice(6, 8), 10);
      const hh = parseInt(dateStr.slice(8, 10), 10);
      const mn = parseInt(dateStr.slice(10, 12), 10);
      const ss = parseInt(dateStr.slice(12, 14), 10);
      return new Date(yy, mm, dd, hh, mn, ss);
    };
  
    const dateToDateStr = (date) => {
      const format = (num) => (num > 9 ? `${num}` : `0${num}`);
      return (
        date.getFullYear() +
        format(date.getMonth() + 1) +
        format(date.getDate()) +
        format(date.getHours()) +
        format(date.getMinutes()) +
        format(date.getSeconds())
      );
    };
  
    const getMonthName = (monthIndex) => {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return monthNames[monthIndex];
    };
  
    const getPastHourFromDate = (date, pastHours) => {
      const pastDate = new Date(date);
      pastDate.setHours(date.getHours() - pastHours);
      return pastDate;
    };
  
    const getPastDateFromDate = (date, pastDays) => {
      const pastDate = new Date(date);
      pastDate.setDate(date.getDate() - pastDays);
      return pastDate;
    };
  
    return {
      stringToDate,
      dateToDateStr,
      getMonthName,
      getPastHourFromDate,
      getPastDateFromDate,
    };
  };
  