const supabase = require('../config/database');

async function migratePaymentData() {
  console.log('🚀 Starting payment data migration...\n');

  try {
    // Step 1: Get all weekly data with payment information
    console.log('📊 Fetching existing weekly data...');
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('weekly_data')
      .select(`
        *,
        classes!inner (
          id,
          class_name,
          quarter_id
        )
      `)
      .order('sabbath_date', { ascending: true });

    if (weeklyError) {
      console.error('❌ Error fetching weekly data:', weeklyError);
      throw weeklyError;
    }

    console.log(`✅ Found ${weeklyData.length} weekly data records\n`);

    // Step 2: Get all class members
    console.log('👥 Fetching class members...');
    const { data: members, error: membersError } = await supabase
      .from('class_members')
      .select('*');

    if (membersError) {
      console.error('❌ Error fetching members:', membersError);
      throw membersError;
    }

    console.log(`✅ Found ${members.length} class members\n`);

    // Step 3: Process each weekly data record
    let totalPaymentsCreated = 0;
    let weekCounter = {};
    let skippedRecords = 0;

    for (const record of weeklyData) {
      const classId = record.class_id;
      const quarterId = record.classes.quarter_id;

      // Calculate week number based on quarter
      const weekKey = `${quarterId}`;
      if (!weekCounter[weekKey]) {
        weekCounter[weekKey] = 1;
      }
      const weekNumber = weekCounter[weekKey];
      weekCounter[weekKey]++;

      console.log(`\n📅 Processing: ${record.classes.class_name} - Week ${weekNumber} (${record.sabbath_date})`);

      // Check if any payment data exists
      const hasPaymentData = 
        record.members_paid_lesson_english ||
        record.members_paid_lesson_luganda ||
        record.members_paid_morning_watch_english ||
        record.members_paid_morning_watch_luganda;

      if (!hasPaymentData) {
        console.log(`  ⚠️  No payment data for this week, skipping...`);
        skippedRecords++;
        continue;
      }

      // Create a map to store member payments
      const memberPayments = {};

      // Helper function to parse payment text with flexible format
      const parsePaymentText = (text) => {
        if (!text || text.trim() === '') return [];
        
        const entries = [];
        // Split by comma, handling spaces
        const parts = text.split(',').map(p => p.trim());
        
        for (const part of parts) {
          if (!part) continue;
          
          // Split by colon, handling spaces
          const colonIndex = part.indexOf(':');
          if (colonIndex === -1) continue;
          
          const name = part.substring(0, colonIndex).trim();
          const amountStr = part.substring(colonIndex + 1).trim();
          const amount = parseFloat(amountStr);
          
          if (name && !isNaN(amount)) {
            entries.push({ name, amount });
          }
        }
        
        return entries;
      };

      // Process lesson English payments
      if (record.members_paid_lesson_english) {
        const entries = parsePaymentText(record.members_paid_lesson_english);
        entries.forEach(({ name, amount }) => {
          if (!memberPayments[name]) memberPayments[name] = {};
          memberPayments[name].lesson_english = amount;
        });
      }

      // Process lesson Luganda payments
      if (record.members_paid_lesson_luganda) {
        const entries = parsePaymentText(record.members_paid_lesson_luganda);
        entries.forEach(({ name, amount }) => {
          if (!memberPayments[name]) memberPayments[name] = {};
          memberPayments[name].lesson_luganda = amount;
        });
      }

      // Process morning watch English payments
      if (record.members_paid_morning_watch_english) {
        const entries = parsePaymentText(record.members_paid_morning_watch_english);
        entries.forEach(({ name, amount }) => {
          if (!memberPayments[name]) memberPayments[name] = {};
          memberPayments[name].morning_watch_english = amount;
        });
      }

      // Process morning watch Luganda payments
      if (record.members_paid_morning_watch_luganda) {
        const entries = parsePaymentText(record.members_paid_morning_watch_luganda);
        entries.forEach(({ name, amount }) => {
          if (!memberPayments[name]) memberPayments[name] = {};
          memberPayments[name].morning_watch_luganda = amount;
        });
      }

      console.log(`  📝 Found ${Object.keys(memberPayments).length} unique members with payments`);

      // Insert payment records for each member
      for (const [memberName, payments] of Object.entries(memberPayments)) {
        // Find member by name in this class (case-insensitive)
        const member = members.find(m => 
          m.class_id === classId && 
          m.member_name.toLowerCase().trim() === memberName.toLowerCase().trim()
        );

        if (!member) {
          console.log(`  ⚠️  Member not found: "${memberName}" (skipping)`);
          continue;
        }

        // Check if adult lesson (10k or 20k)
        let adult_lesson_english_10k = false;
        let adult_lesson_english_20k = false;
        let adult_lesson_luganda_10k = false;
        let adult_lesson_luganda_20k = false;
        let regular_lesson_english = payments.lesson_english || 0;
        let regular_lesson_luganda = payments.lesson_luganda || 0;

        // Detect adult lessons based on amount
        if (payments.lesson_english === 10000) {
          adult_lesson_english_10k = true;
          regular_lesson_english = 0;
        } else if (payments.lesson_english === 20000) {
          adult_lesson_english_20k = true;
          regular_lesson_english = 0;
        }

        if (payments.lesson_luganda === 10000) {
          adult_lesson_luganda_10k = true;
          regular_lesson_luganda = 0;
        } else if (payments.lesson_luganda === 20000) {
          adult_lesson_luganda_20k = true;
          regular_lesson_luganda = 0;
        }

        // Insert payment record
        const { data: newPayment, error: paymentError } = await supabase
          .from('member_payment_history')
          .upsert({
            member_id: member.id,
            quarter_id: quarterId,
            week_number: weekNumber,
            payment_date: record.sabbath_date,
            lesson_english: regular_lesson_english,
            lesson_luganda: regular_lesson_luganda,
            adult_lesson_english_10k,
            adult_lesson_english_20k,
            adult_lesson_luganda_10k,
            adult_lesson_luganda_20k,
            morning_watch_english: payments.morning_watch_english || 0,
            morning_watch_luganda: payments.morning_watch_luganda || 0,
            notes: `Migrated from weekly_data (ID: ${record.id})`
          }, {
            onConflict: 'member_id,quarter_id,week_number',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (paymentError) {
          console.log(`  ❌ Error creating payment for ${memberName}:`, paymentError.message);
        } else {
          console.log(`  ✅ Created payment for ${memberName}: ${newPayment.week_total} UGX`);
          totalPaymentsCreated++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total weekly records processed: ${weeklyData.length}`);
    console.log(`⏭️  Records skipped (no payment data): ${skippedRecords}`);
    console.log(`💰 Total payment records created: ${totalPaymentsCreated}`);
    console.log('\n✅ Payment totals have been automatically calculated by triggers!');
    console.log('📈 You can now view the data in Payment History report\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePaymentData()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migratePaymentData };