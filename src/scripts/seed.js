/**
 * Seed script — populates the database with demo users and financial records.
 *
 * Usage:  npm run seed
 */
import bcrypt from 'bcryptjs';
import { initDatabase, saveDatabase, closeDatabase } from '../config/database.js';

const SALT_ROUNDS = 10;

async function seed() {
  const db = await initDatabase();
  console.log('📦 Seeding database...\n');

  // ── clean slate ──────────────────────────────────────────────
  db.run('DELETE FROM audit_log');
  db.run('DELETE FROM records');
  db.run('DELETE FROM users');

  // ── users ────────────────────────────────────────────────────
  const users = [
    { email: 'admin@finance.app', password: 'admin123', name: 'Sarah Admin', role: 'admin' },
    { email: 'analyst@finance.app', password: 'analyst123', name: 'James Analyst', role: 'analyst' },
    { email: 'viewer@finance.app', password: 'viewer123', name: 'Emma Viewer', role: 'viewer' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    db.run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [u.email, hash, u.name, u.role],
    );
    console.log(`  👤 Created ${u.role}: ${u.email}  (password: ${u.password})`);
  }

  // ── financial records ────────────────────────────────────────
  const records = [
    // January 2025
    { amount: 5000, type: 'income',  category: 'Salary',        date: '2025-01-05', description: 'Monthly salary' },
    { amount: 1200, type: 'expense', category: 'Rent',          date: '2025-01-07', description: 'Office rent' },
    { amount: 350,  type: 'expense', category: 'Utilities',     date: '2025-01-10', description: 'Electricity & internet' },
    { amount: 800,  type: 'income',  category: 'Freelance',     date: '2025-01-15', description: 'Design project payment' },
    { amount: 150,  type: 'expense', category: 'Software',      date: '2025-01-18', description: 'SaaS subscription' },

    // February 2025
    { amount: 5000, type: 'income',  category: 'Salary',        date: '2025-02-05', description: 'Monthly salary' },
    { amount: 1200, type: 'expense', category: 'Rent',          date: '2025-02-07', description: 'Office rent' },
    { amount: 200,  type: 'expense', category: 'Travel',        date: '2025-02-12', description: 'Client meeting travel' },
    { amount: 2500, type: 'income',  category: 'Consulting',    date: '2025-02-20', description: 'Strategy consulting' },
    { amount: 450,  type: 'expense', category: 'Marketing',     date: '2025-02-25', description: 'Online ads campaign' },

    // March 2025
    { amount: 5000, type: 'income',  category: 'Salary',        date: '2025-03-05', description: 'Monthly salary' },
    { amount: 1200, type: 'expense', category: 'Rent',          date: '2025-03-07', description: 'Office rent' },
    { amount: 600,  type: 'expense', category: 'Equipment',     date: '2025-03-11', description: 'New monitor' },
    { amount: 1500, type: 'income',  category: 'Freelance',     date: '2025-03-18', description: 'Web development gig' },
    { amount: 300,  type: 'expense', category: 'Utilities',     date: '2025-03-22', description: 'Phone and broadband' },
    { amount: 75,   type: 'expense', category: 'Office Supplies', date: '2025-03-28', description: 'Stationery and toner' },

    // April 2025
    { amount: 5200, type: 'income',  category: 'Salary',        date: '2025-04-05', description: 'Salary with bonus' },
    { amount: 1200, type: 'expense', category: 'Rent',          date: '2025-04-07', description: 'Office rent' },
    { amount: 950,  type: 'expense', category: 'Insurance',     date: '2025-04-10', description: 'Annual business insurance' },
    { amount: 3000, type: 'income',  category: 'Consulting',    date: '2025-04-15', description: 'Quarterly retainer' },

    // May 2025
    { amount: 5000, type: 'income',  category: 'Salary',        date: '2025-05-05', description: 'Monthly salary' },
    { amount: 1200, type: 'expense', category: 'Rent',          date: '2025-05-07', description: 'Office rent' },
    { amount: 250,  type: 'expense', category: 'Software',      date: '2025-05-14', description: 'Cloud hosting' },
    { amount: 180,  type: 'expense', category: 'Travel',        date: '2025-05-20', description: 'Conference transport' },
    { amount: 4000, type: 'income',  category: 'Freelance',     date: '2025-05-25', description: 'Mobile app project' },
  ];

  // records are all created by the admin (user id = 1)
  for (const r of records) {
    db.run(
      `INSERT INTO records (user_id, amount, type, category, date, description)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [r.amount, r.type, r.category, r.date, r.description],
    );
  }
  console.log(`\n  💰 Created ${records.length} financial records`);

  saveDatabase();
  closeDatabase();
  console.log('\n✅ Seed complete!\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
