const getQuarterDates = (quarterName, year) => {
  const quarters = {
    'Q1': { start: `${year}-01-01`, end: `${year}-03-31` },
    'Q2': { start: `${year}-04-01`, end: `${year}-06-30` },
    'Q3': { start: `${year}-07-01`, end: `${year}-09-30` },
    'Q4': { start: `${year}-10-01`, end: `${year}-12-31` }
  };
  return quarters[quarterName] || null;
};

const getSabbathDate = (weekNumber, quarterStartDate) => {
  const start = new Date(quarterStartDate);
  // Find first Saturday
  const dayOfWeek = start.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  const firstSaturday = new Date(start);
  firstSaturday.setDate(start.getDate() + daysUntilSaturday);
  
  // Add weeks
  const targetDate = new Date(firstSaturday);
  targetDate.setDate(firstSaturday.getDate() + (weekNumber - 1) * 7);
  
  return targetDate.toISOString().split('T')[0];
};

const getCurrentWeekNumber = (quarterStartDate) => {
  const start = new Date(quarterStartDate);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.ceil(diffDays / 7), 13);
};

module.exports = {
  getQuarterDates,
  getSabbathDate,
  getCurrentWeekNumber
};