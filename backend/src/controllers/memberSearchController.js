const supabase = require('../config/database');

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

    const { data, error } = await supabase
      .from('class_members')
      .select(`
        id,
        member_name,
        classes!inner (
          id,
          class_name,
          teacher_name,
          quarters (
            name,
            year
          )
        )
      `)
      .ilike('member_name', searchTerm)
      .order('member_name');

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    // Transform the data to flatten the structure
    const results = data.map(member => ({
      member_id: member.id,
      member_name: member.member_name,
      class_id: member.classes.id,
      class_name: member.classes.class_name,
      teacher_name: member.classes.teacher_name,
      quarter_name: member.classes.quarters?.name || null,
      quarter_year: member.classes.quarters?.year || null
    }));

    console.log('Search results:', results.length, 'members found');

    res.json({
      success: true,
      data: results,
      count: results.length
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