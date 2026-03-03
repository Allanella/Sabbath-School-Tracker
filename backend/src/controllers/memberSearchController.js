const pool = require('../config/database');

const searchMembers = async (req, res) => {
  try {
    const { query } = req.query;

    console.log('Search query received:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchTerm = `%${query.trim()}%`;

    const result = await pool.query(
      `SELECT 
        cm.id as member_id,
        cm.member_name,
        c.id as class_id,
        c.class_name,
        c.teacher_name,
        q.name as quarter_name,
        q.year as quarter_year
      FROM class_members cm
      JOIN classes c ON cm.class_id = c.id
      LEFT JOIN quarters q ON c.quarter_id = q.id
      WHERE LOWER(cm.member_name) LIKE LOWER($1)
      ORDER BY cm.member_name ASC`,
      [searchTerm]
    );

    console.log('Search results:', result.rows.length, 'members found');

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Member search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search members',
      error: error.message
    });
  }
};

module.exports = {
  searchMembers
};