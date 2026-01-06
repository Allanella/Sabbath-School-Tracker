
const supabase = require('../config/database');

const reportController = {
  // Get weekly report for a specific week
  getWeeklyReport: async (req, res, next) => {
    try {
      const { quarter_id, week_number } = req.query;

      const { data, error } = await supabase
        .from('weekly_data')
        .select(`
          *,
          class:classes(
            class_name,
            teacher_name,
            secretary_name,
            quarter:quarters(name, year)
          )
        `)
        .eq('week_number', week_number)
        .eq('class.quarter_id', quarter_id);

      if (error) throw error;

      // Calculate totals
      const totals = data.reduce((acc, record) => ({
        total_attendance: acc.total_attendance + (record.total_attendance || 0),
        total_visits: acc.total_visits + (record.member_visits || 0),
        total_offerings: acc.total_offerings + parseFloat(record.offering_global_mission || 0),
        total_visitors: acc.total_visitors + (record.number_of_visitors || 0),
        classes_count: acc.classes_count + 1
      }), {
        total_attendance: 0,
        total_visits: 0,
        total_offerings: 0,
        total_visitors: 0,
        classes_count: 0
      });

      res.json({
        success: true,
        data: {
          week_number,
          classes: data,
          summary: totals
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get quarterly report for a class
  getClassQuarterlyReport: async (req, res, next) => {
    try {
      const { class_id } = req.params;

      // Get class info
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          quarter:quarters(*)
        `)
        .eq('id', class_id)
        .single();

      if (classError) throw classError;

      // Get all weekly data
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_data')
        .select('*')
        .eq('class_id', class_id)
        .order('week_number');

      if (weeklyError) throw weeklyError;

      // Calculate quarterly totals
      const totals = weeklyData.reduce((acc, week) => ({
        total_attendance: acc.total_attendance + (week.total_attendance || 0),
        total_visits: acc.total_visits + (week.member_visits || 0),
        total_bible_studies: acc.total_bible_studies + (week.members_conducted_bible_studies || 0),
        total_helped_others: acc.total_helped_others + (week.members_helped_others || 0),
        total_studied_lesson: acc.total_studied_lesson + (week.members_studied_lesson || 0),
        total_visitors: acc.total_visitors + (week.number_of_visitors || 0),
        total_guides_distributed: acc.total_guides_distributed + (week.bible_study_guides_distributed || 0),
        total_offerings: acc.total_offerings + parseFloat(week.offering_global_mission || 0),
        lesson_english: acc.lesson_english + (week.members_paid_lesson_english || 0),
        lesson_luganda: acc.lesson_luganda + (week.members_paid_lesson_luganda || 0),
        morning_watch_english: acc.morning_watch_english + (week.members_paid_morning_watch_english || 0),
        morning_watch_luganda: acc.morning_watch_luganda + (week.members_paid_morning_watch_luganda || 0),
        weeks_reported: acc.weeks_reported + 1
      }), {
        total_attendance: 0,
        total_visits: 0,
        total_bible_studies: 0,
        total_helped_others: 0,
        total_studied_lesson: 0,
        total_visitors: 0,
        total_guides_distributed: 0,
        total_offerings: 0,
        lesson_english: 0,
        lesson_luganda: 0,
        morning_watch_english: 0,
        morning_watch_luganda: 0,
        weeks_reported: 0
      });

      // Calculate averages
      const averages = {
        avg_attendance: totals.weeks_reported > 0 
          ? (totals.total_attendance / totals.weeks_reported).toFixed(2) 
          : 0
      };

      res.json({
        success: true,
        data: {
          class: classInfo,
          weekly_data: weeklyData,
          totals,
          averages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get quarterly report for entire church
  getChurchQuarterlyReport: async (req, res, next) => {
    try {
      const { quarter_id } = req.params;

      // Get all classes for this quarter
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('quarter_id', quarter_id);

      if (classError) throw classError;

      // Get all weekly data for all classes
      const classIds = classes.map(c => c.id);
      const { data: allWeeklyData, error: weeklyError } = await supabase
        .from('weekly_data')
        .select('*')
        .in('class_id', classIds);

      if (weeklyError) throw weeklyError;

      // Calculate church-wide totals
      const churchTotals = allWeeklyData.reduce((acc, week) => ({
        total_attendance: acc.total_attendance + (week.total_attendance || 0),
        total_visits: acc.total_visits + (week.member_visits || 0),
        total_bible_studies: acc.total_bible_studies + (week.members_conducted_bible_studies || 0),
        total_offerings: acc.total_offerings + parseFloat(week.offering_global_mission || 0),
        total_visitors: acc.total_visitors + (week.number_of_visitors || 0)
      }), {
        total_attendance: 0,
        total_visits: 0,
        total_bible_studies: 0,
        total_offerings: 0,
        total_visitors: 0
      });

      // Group by class
      const classSummaries = classes.map(classItem => {
        const classWeeks = allWeeklyData.filter(w => w.class_id === classItem.id);
        const classTotal = classWeeks.reduce((acc, week) => 
          acc + (week.total_attendance || 0), 0
        );
        
        return {
          ...classItem,
          weeks_reported: classWeeks.length,
          total_attendance: classTotal,
          avg_attendance: classWeeks.length > 0 
            ? (classTotal / classWeeks.length).toFixed(2) 
            : 0
        };
      });

      res.json({
        success: true,
        data: {
          quarter_id,
          classes: classSummaries,
          church_totals: churchTotals,
          total_classes: classes.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get financial report
  getFinancialReport: async (req, res, next) => {
    try {
      const { quarter_id, class_id } = req.query;

      let query = supabase
        .from('weekly_data')
        .select(`
          *,
          class:classes(
            class_name,
            quarter_id
          )
        `);

      if (class_id) {
        query = query.eq('class_id', class_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by quarter if needed
      let filteredData = data;
      if (quarter_id) {
        filteredData = data.filter(d => d.class.quarter_id === quarter_id);
      }

      // Calculate financial totals
      const financials = filteredData.reduce((acc, week) => ({
        global_mission: acc.global_mission + parseFloat(week.offering_global_mission || 0),
        lesson_payments: acc.lesson_payments + 
          (week.members_paid_lesson_english || 0) + 
          (week.members_paid_lesson_luganda || 0),
        morning_watch_payments: acc.morning_watch_payments + 
          (week.members_paid_morning_watch_english || 0) + 
          (week.members_paid_morning_watch_luganda || 0)
      }), {
        global_mission: 0,
        lesson_payments: 0,
        morning_watch_payments: 0
      });

      financials.total = 
        financials.global_mission + 
        financials.lesson_payments + 
        financials.morning_watch_payments;

      res.json({
        success: true,
        data: {
          financials,
          breakdown: filteredData.map(w => ({
            week_number: w.week_number,
            class_name: w.class.class_name,
            sabbath_date: w.sabbath_date,
            offering_global_mission: parseFloat(w.offering_global_mission || 0),
            lesson_payments: (w.members_paid_lesson_english || 0) + 
                           (w.members_paid_lesson_luganda || 0),
            morning_watch_payments: (w.members_paid_morning_watch_english || 0) + 
                                   (w.members_paid_morning_watch_luganda || 0)
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportController;