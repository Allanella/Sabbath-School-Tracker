const supabase = require('../config/database');

const copyQuarterData = async (req, res) => {
  try {
    const { source_quarter_id, target_quarter_id } = req.body;

    console.log('Copying quarter data:', { source_quarter_id, target_quarter_id });

    if (!source_quarter_id || !target_quarter_id) {
      return res.status(400).json({
        success: false,
        message: 'source_quarter_id and target_quarter_id are required'
      });
    }

    // Step 1: Get all classes from source quarter
    const { data: sourceClasses, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('quarter_id', source_quarter_id);

    if (classesError) {
      console.error('Error fetching source classes:', classesError);
      throw classesError;
    }

    console.log(`Found ${sourceClasses.length} classes to copy`);

    let totalClassesCopied = 0;
    let totalMembersCopied = 0;

    // Step 2: Copy each class and its members
    for (const sourceClass of sourceClasses) {
      // Create new class in target quarter with all required fields
      const { data: newClass, error: newClassError } = await supabase
        .from('classes')
        .insert({
          quarter_id: target_quarter_id,
          class_name: sourceClass.class_name,
          teacher_name: sourceClass.teacher_name,
          secretary_name: sourceClass.secretary_name || '', // Provide default empty string if null
          secretary_id: sourceClass.secretary_id,
          church_name: sourceClass.church_name
        })
        .select()
        .single();

      if (newClassError) {
        console.error(`Error creating class ${sourceClass.class_name}:`, newClassError);
        continue; // Skip this class if it fails
      }

      totalClassesCopied++;
      console.log(`Created class: ${newClass.class_name}`);

      // Get members from source class
      const { data: sourceMembers, error: membersError } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', sourceClass.id);

      if (membersError) {
        console.error(`Error fetching members for class ${sourceClass.class_name}:`, membersError);
        continue;
      }

      console.log(`Found ${sourceMembers.length} members in ${sourceClass.class_name}`);

      // Copy members to new class
      if (sourceMembers.length > 0) {
        const membersToInsert = sourceMembers.map(member => ({
          class_id: newClass.id,
          member_name: member.member_name
        }));

        const { data: newMembers, error: insertMembersError } = await supabase
          .from('class_members')
          .insert(membersToInsert)
          .select();

        if (insertMembersError) {
          console.error(`Error inserting members for ${newClass.class_name}:`, insertMembersError);
        } else {
          totalMembersCopied += newMembers.length;
          console.log(`Copied ${newMembers.length} members to ${newClass.class_name}`);
        }
      }
    }

    console.log('Copy complete:', { totalClassesCopied, totalMembersCopied });

    res.json({
      success: true,
      message: 'Quarter data copied successfully',
      data: {
        classes_copied: totalClassesCopied,
        members_copied: totalMembersCopied
      }
    });

  } catch (error) {
    console.error('Copy quarter data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to copy quarter data',
      error: error.message
    });
  }
};

module.exports = {
  copyQuarterData
};