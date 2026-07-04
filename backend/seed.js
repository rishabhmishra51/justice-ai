require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Case, Suspect, Evidence, CaseSuspect, SuspectRelation } = require('./models');

async function seed() {
  try {
    if (process.env.SEED_DEMO_DATA !== 'true') {
      console.log('ℹ️ Demo seeding skipped. Set SEED_DEMO_DATA=true to seed demo data.');
      process.exit(0);
    }

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ DB synced');

    const demoPassword = process.env.DEMO_PASSWORD || 'change-me';

    // Users
    const hash = await bcrypt.hash(demoPassword, 12);
    const admin = await User.create({ name: 'Rishabh Mishra', email: 'admin@justice.ai', password: hash, role: 'admin' });
    const inv   = await User.create({ name: 'Rishabh Mishra', email: 'inv@justice.ai', password: hash, role: 'investigator' });

    // Suspects
    const suspects = await Promise.all([
      Suspect.create({ name: 'Vikram Sinha', alias: 'Vicky', risk_level: 'critical', status: 'active', occupation: 'Businessman', nationality: 'Indian', notes: 'Known organized crime leader' }),
      Suspect.create({ name: 'Priya Sharma', alias: 'P.S.', risk_level: 'high', status: 'arrested', occupation: 'Accountant', nationality: 'Indian', notes: 'Financial coordinator' }),
      Suspect.create({ name: 'Rahul Verma', alias: 'RV', risk_level: 'medium', status: 'active', occupation: 'Driver', nationality: 'Indian' }),
      Suspect.create({ name: 'Sunita Mehta', risk_level: 'low', status: 'acquitted', occupation: 'Teacher', nationality: 'Indian' }),
      Suspect.create({ name: 'Arun Kapoor', alias: 'The Fixer', risk_level: 'high', status: 'active', occupation: 'Lawyer', nationality: 'Indian' }),
    ]);

    // Cases: 20+ entries for demo
    const baselineCases = [
      { title: 'Bank Fraud Network - Delhi', description: 'Multi-crore bank fraud involving shell companies and hawala networks operating across Delhi NCR.', status: 'active', priority: 'critical', jurisdiction: 'Delhi High Court', category: 'Financial Fraud', filed_date: '2024-03-15', created_by: admin.id },
      { title: 'Corporate Espionage - TechCorp', description: 'Theft of proprietary source code and client data from TechCorp Pvt. Ltd.', status: 'open', priority: 'high', jurisdiction: 'Bombay High Court', category: 'Cyber Crime', filed_date: '2024-06-20', created_by: inv.id },
      { title: 'Money Laundering - Real Estate', description: 'Suspected money laundering through real estate purchases in Gurgaon and Noida.', status: 'pending', priority: 'high', jurisdiction: 'Allahabad High Court', category: 'Money Laundering', filed_date: '2024-09-01', created_by: admin.id },
      { title: 'Assault - Market Street', description: 'Physical assault reported near Connaught Place market area.', status: 'closed', priority: 'medium', jurisdiction: 'District Court Delhi', category: 'Assault', filed_date: '2024-01-10', verdict: 'Convicted - 2 years imprisonment', created_by: inv.id },
    ];

    // additional synthetic cases
    for (let i = 1; i <= 30; i++) {
      baselineCases.push({
        title: `Rishabh Case ${i} - Infra & Cyber`,
        description: `Generated demo case ${i} for Rishabh. Includes randomized investigative scenario and follow-up actions.`,
        status: ['open','active','closed','pending'][i % 4],
        priority: ['low','medium','high','critical'][i % 4],
        jurisdiction: ['Delhi High Court','Bombay High Court','Karnataka High Court','Allahabad High Court'][i % 4],
        category: ['Cyber Crime','Financial Fraud','Corruption','Narcotics'][i % 4],
        filed_date: `2025-${(i % 12 + 1).toString().padStart(2,'0')}-${(i % 28 + 1).toString().padStart(2,'0')}`,
        created_by: i % 2 === 0 ? inv.id : admin.id
      });
    }

    const cases = await Promise.all(baselineCases.map(caseData => Case.create(caseData)));

    // Evidence
    await Promise.all([
      Evidence.create({ case_id: cases[0].id, title: 'Bank Transaction Records', type: 'document', description: 'Suspicious transactions worth ₹47 crore over 18 months', collected_by: 'CBI Team', is_verified: true }),
      Evidence.create({ case_id: cases[0].id, title: 'Shell Company Registration Docs', type: 'document', description: '14 shell companies registered with same directors', collected_by: 'Registrar Office', is_verified: false }),
      Evidence.create({ case_id: cases[0].id, title: 'CCTV Footage - Bank Branch', type: 'digital', description: 'Footage from 3 bank branches showing suspicious activity', collected_by: 'Delhi Police', is_verified: true }),
      Evidence.create({ case_id: cases[1].id, title: 'Server Logs', type: 'digital', description: 'Unauthorized access logs from TechCorp servers', collected_by: 'Cyber Cell', is_verified: true }),
      Evidence.create({ case_id: cases[1].id, title: 'USB Drive', type: 'physical', description: 'USB drive found with 4.2GB of proprietary code', collected_by: 'IT Forensics', is_verified: true }),
      Evidence.create({ case_id: cases[2].id, title: 'Property Registration Records', type: 'document', description: '23 properties registered in 18 months for cash', collected_by: 'ED', is_verified: false }),
    ]);

    // Link suspects to cases
    await CaseSuspect.create({ case_id: cases[0].id, suspect_id: suspects[0].id, role: 'primary' });
    await CaseSuspect.create({ case_id: cases[0].id, suspect_id: suspects[1].id, role: 'accomplice' });
    await CaseSuspect.create({ case_id: cases[0].id, suspect_id: suspects[4].id, role: 'associate' });
    await CaseSuspect.create({ case_id: cases[1].id, suspect_id: suspects[2].id, role: 'suspect' });
    await CaseSuspect.create({ case_id: cases[2].id, suspect_id: suspects[0].id, role: 'primary' });
    await CaseSuspect.create({ case_id: cases[2].id, suspect_id: suspects[4].id, role: 'associate' });
    await CaseSuspect.create({ case_id: cases[3].id, suspect_id: suspects[3].id, role: 'suspect' });

    // Suspect relations (graph edges)
    const relations = [
      [suspects[0].id, suspects[1].id, 'accomplice', 0.9],
      [suspects[0].id, suspects[4].id, 'associate',  0.7],
      [suspects[1].id, suspects[2].id, 'associate',  0.5],
      [suspects[4].id, suspects[2].id, 'associate',  0.4],
    ];
    for (const [s1, s2, type, strength] of relations) {
      await SuspectRelation.create({ suspect_id: s1, related_suspect_id: s2, relation_type: type, strength });
      await SuspectRelation.create({ suspect_id: s2, related_suspect_id: s1, relation_type: type, strength });
    }

    console.log('✅ Seed complete!');
    console.log(`📧 Login: admin@justice.ai / ${demoPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    if (err.errors && err.errors.length) {
      err.errors.forEach(e => console.error(' -', e.message, 'field:', e.path, 'value:', e.value));
    }
    process.exit(1);
  }
}

seed();
