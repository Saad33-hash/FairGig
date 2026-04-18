const Shift = require('../models/Shift');

// GET /api/analytics/worker/summary
const workerSummary = async (req, res) => {
  try {
    const shifts = await Shift.find({ workerId: req.user.id }).sort({ date: 1 });

    if (shifts.length === 0) {
      return res.json({ monthly: [], platformBreakdown: [], totalNet: 0, avgHourlyRate: 0 });
    }

    // Monthly net earnings
    const monthlyMap = {};
    for (const s of shifts) {
      const key = s.date.toISOString().slice(0, 7); // "YYYY-MM"
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, net: 0, gross: 0, hours: 0, deductions: 0 };
      monthlyMap[key].net        += s.netReceived;
      monthlyMap[key].gross      += s.grossEarned;
      monthlyMap[key].hours      += s.hoursWorked;
      monthlyMap[key].deductions += s.platformDeductions;
    }
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Per-platform commission rate
    const platformMap = {};
    for (const s of shifts) {
      if (!platformMap[s.platform]) platformMap[s.platform] = { platform: s.platform, totalGross: 0, totalDeductions: 0, count: 0 };
      platformMap[s.platform].totalGross       += s.grossEarned;
      platformMap[s.platform].totalDeductions  += s.platformDeductions;
      platformMap[s.platform].count            += 1;
    }
    const platformBreakdown = Object.values(platformMap).map((p) => ({
      platform:       p.platform,
      count:          p.count,
      avgCommission:  p.totalGross > 0 ? Math.round((p.totalDeductions / p.totalGross) * 100) : 0,
      totalNet:       Math.round(p.totalGross - p.totalDeductions),
    }));

    const totalNet      = shifts.reduce((s, sh) => s + sh.netReceived, 0);
    const totalHours    = shifts.reduce((s, sh) => s + sh.hoursWorked, 0);
    const avgHourlyRate = totalHours > 0 ? Math.round(totalNet / totalHours) : 0;

    return res.json({ monthly, platformBreakdown, totalNet: Math.round(totalNet), avgHourlyRate });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/analytics/worker/city-median
const cityMedian = async (req, res) => {
  try {
    const workerShifts = await Shift.find({ workerId: req.user.id });
    if (workerShifts.length === 0) {
      return res.json({ workerMonthlyAvg: 0, cityMedian: 0, percentile: null, city: null, category: null });
    }

    // Determine worker's city + category from their most recent shift
    const latest   = workerShifts.sort((a, b) => b.date - a.date)[0];
    const city      = latest.city;
    const category  = latest.category;

    // All workers in same city + category (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const peerShifts = await Shift.find({
      city,
      category,
      date: { $gte: threeMonthsAgo },
    });

    // Group peer shifts by workerId → monthly net totals → median
    const peerMonthly = {};
    for (const s of peerShifts) {
      const wid = s.workerId.toString();
      if (!peerMonthly[wid]) peerMonthly[wid] = 0;
      peerMonthly[wid] += s.netReceived;
    }
    const peerTotals = Object.values(peerMonthly);

    const median = (arr) => {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    };

    const cityMedianValue = Math.round(median(peerTotals));

    // Worker's own 3-month net
    const workerRecent = workerShifts.filter((s) => s.date >= threeMonthsAgo);
    const workerTotal  = workerRecent.reduce((s, sh) => s + sh.netReceived, 0);
    const workerMonthlyAvg = workerRecent.length > 0 ? Math.round(workerTotal / 3) : 0;

    // Percentile
    let percentile = null;
    if (peerTotals.length > 1) {
      const below = peerTotals.filter((v) => v < workerTotal).length;
      percentile  = Math.round((below / peerTotals.length) * 100);
    }

    return res.json({ workerMonthlyAvg, cityMedian: cityMedianValue, percentile, city, category, peerCount: peerTotals.length });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { workerSummary, cityMedian };
