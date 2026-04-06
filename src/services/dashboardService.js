import Record from '../models/Record.js';

const dashboardService = {
  /**
   * High‑level summary: total income, total expenses, net balance, record count.
   */
  getSummary() {
    return Record.getSummary();
  },

  /**
   * Category‑wise breakdown of income and expenses.
   */
  getCategoryTotals() {
    const raw = Record.getCategoryTotals();

    // reshape into a more frontend‑friendly structure
    const categories = {};
    for (const row of raw) {
      if (!categories[row.category]) {
        categories[row.category] = { category: row.category, income: 0, expense: 0, count: 0 };
      }
      categories[row.category][row.type] = row.total;
      categories[row.category].count += row.count;
    }

    return Object.values(categories);
  },

  /**
   * Monthly income/expense trends for a given year.
   * Returns an array of 12 month objects.
   */
  getMonthlyTrends(year) {
    const raw = Record.getMonthlyTrends(year);

    // pre‑fill all 12 months so the frontend always gets a complete series
    const months = {};
    for (let m = 1; m <= 12; m++) {
      const key = String(m).padStart(2, '0');
      months[key] = { month: key, income: 0, expense: 0, count: 0 };
    }

    for (const row of raw) {
      months[row.month][row.type] = row.total;
      months[row.month].count += row.count;
    }

    return Object.values(months);
  },

  /**
   * Most recent N transactions.
   */
  getRecentActivity(limit = 10) {
    return Record.getRecent(limit);
  },
};

export default dashboardService;
