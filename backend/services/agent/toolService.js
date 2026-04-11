'use strict';

/**
 * toolService.js
 * 
 * Agent tool system — a set of structured analysis functions that the
 * agent can invoke when the user question requires computed data rather
 * than free-form LLM reasoning.
 * 
 * Each tool:
 *   - Accepts parameters (typically an infantId)
 *   - Queries MongoDB
 *   - Returns a structured JSON result + a human-readable summary
 */

const Infant = require('../../models/Infant');
const Growth = require('../../models/Growth');
const Routine = require('../../models/Routine');
const Milestone = require('../../models/Milestone');
const Scheme = require('../../models/Scheme');

// ---------------------------------------------------------------------------
// Tool registry — maps tool names to their implementations
// ---------------------------------------------------------------------------

const TOOLS = {};

// ---------------------------------------------------------------------------
// Tool: getGrowthTrend
// ---------------------------------------------------------------------------
TOOLS.getGrowthTrend = {
  description: 'Analyses weight, height, and head circumference trends over time.',
  requiredParams: ['infantId'],

  execute: async ({ infantId }) => {
    const records = await Growth.find({ infant: infantId })
      .sort({ date: 1 })
      .lean();

    // Also check inline growthData on the infant document
    const infant = await Infant.findById(infantId).lean();

    // Merge sources — prefer Growth collection, fall back to inline
    let data = records;
    if (data.length === 0 && infant?.growthData?.length > 0) {
      data = infant.growthData.map(g => ({
        date: g.date,
        weight: g.weight,
        height: g.height,
        headCircumference: g.headCircumference,
      }));
    }

    if (data.length === 0) {
      return {
        summary: 'No growth data available for analysis.',
        data: { records: 0 },
      };
    }

    const weights = data.filter(d => d.weight).map(d => d.weight);
    const heights = data.filter(d => d.height).map(d => d.height);
    const heads = data.filter(d => d.headCircumference).map(d => d.headCircumference);

    const trend = (arr) => {
      if (arr.length < 2) return { direction: 'insufficient data', change: 0 };
      const change = arr[arr.length - 1] - arr[0];
      const recentChange = arr[arr.length - 1] - arr[arr.length - 2];
      return {
        direction: recentChange > 0.05 ? 'increasing' : recentChange < -0.05 ? 'decreasing' : 'stable',
        totalChange: parseFloat(change.toFixed(2)),
        recentChange: parseFloat(recentChange.toFixed(2)),
        latest: arr[arr.length - 1],
        earliest: arr[0],
        count: arr.length,
      };
    };

    const result = {
      weight: trend(weights),
      height: trend(heights),
      headCircumference: trend(heads),
      totalRecords: data.length,
      dateRange: {
        from: data[0]?.date,
        to: data[data.length - 1]?.date,
      },
    };

    // Build human-readable summary
    const lines = [];
    lines.push(`Growth Trend Analysis (${data.length} records):`);
    if (result.weight.count >= 2) {
      lines.push(`  Weight: ${result.weight.direction} (${result.weight.earliest} → ${result.weight.latest} kg, total change: ${result.weight.totalChange} kg)`);
    }
    if (result.height.count >= 2) {
      lines.push(`  Height: ${result.height.direction} (${result.height.earliest} → ${result.height.latest} cm, total change: ${result.height.totalChange} cm)`);
    }
    if (result.headCircumference.count >= 2) {
      lines.push(`  Head Circumference: ${result.headCircumference.direction} (${result.headCircumference.earliest} → ${result.headCircumference.latest} cm)`);
    }

    return { summary: lines.join('\n'), data: result };
  },
};

// ---------------------------------------------------------------------------
// Tool: getSleepAnalysis
// ---------------------------------------------------------------------------
TOOLS.getSleepAnalysis = {
  description: 'Analyses sleep routine compliance and patterns.',
  requiredParams: ['infantId'],

  execute: async ({ infantId }) => {
    // Get sleep-related routines
    const sleepRoutines = await Routine.find({
      category: 'sleep',
      isActive: true,
      $or: [
        { isPersonalized: false },
        { isPersonalized: true, infantId },
      ],
    }).lean();

    const infant = await Infant.findById(infantId).lean();

    if (!infant) {
      return { summary: 'Infant not found.', data: {} };
    }

    const sleepRoutineIds = new Set(sleepRoutines.map(r => r._id.toString()));

    // Analyse routine logs from infant.routines
    let totalDays = 0;
    let daysWithSleep = 0;

    if (infant.routines && infant.routines.length > 0) {
      const recentDays = infant.routines.slice(-14); // Last 14 days
      totalDays = recentDays.length;
      recentDays.forEach(day => {
        const hasSleep = day.routineIds?.some(id => sleepRoutineIds.has(id.toString()));
        if (hasSleep) daysWithSleep++;
      });
    }

    const complianceRate = totalDays > 0
      ? parseFloat(((daysWithSleep / totalDays) * 100).toFixed(1))
      : 0;

    const result = {
      availableSleepRoutines: sleepRoutines.length,
      routineNames: sleepRoutines.map(r => r.name),
      daysAnalysed: totalDays,
      daysWithSleepRoutine: daysWithSleep,
      complianceRate,
    };

    const summary = [
      `Sleep Analysis:`,
      `  Available sleep routines: ${result.availableSleepRoutines} (${result.routineNames.join(', ') || 'none'})`,
      `  Days analysed: ${totalDays}`,
      `  Days with sleep routine logged: ${daysWithSleep}`,
      `  Compliance rate: ${complianceRate}%`,
      complianceRate < 50 ? '  ⚠ Sleep routine compliance is low.' : '  ✓ Sleep routine compliance is adequate.',
    ].join('\n');

    return { summary, data: result };
  },
};

// ---------------------------------------------------------------------------
// Tool: getFeedingSummary
// ---------------------------------------------------------------------------
TOOLS.getFeedingSummary = {
  description: 'Summarises feeding routine patterns and compliance.',
  requiredParams: ['infantId'],

  execute: async ({ infantId }) => {
    const feedingRoutines = await Routine.find({
      category: 'feeding',
      isActive: true,
      $or: [
        { isPersonalized: false },
        { isPersonalized: true, infantId },
      ],
    }).lean();

    const infant = await Infant.findById(infantId).lean();

    if (!infant) {
      return { summary: 'Infant not found.', data: {} };
    }

    const feedingIds = new Set(feedingRoutines.map(r => r._id.toString()));

    let totalDays = 0;
    let daysWithFeeding = 0;

    if (infant.routines && infant.routines.length > 0) {
      const recentDays = infant.routines.slice(-14);
      totalDays = recentDays.length;
      recentDays.forEach(day => {
        const hasFeeding = day.routineIds?.some(id => feedingIds.has(id.toString()));
        if (hasFeeding) daysWithFeeding++;
      });
    }

    const complianceRate = totalDays > 0
      ? parseFloat(((daysWithFeeding / totalDays) * 100).toFixed(1))
      : 0;

    const result = {
      availableFeedingRoutines: feedingRoutines.length,
      routineNames: feedingRoutines.map(r => r.name),
      daysAnalysed: totalDays,
      daysWithFeedingRoutine: daysWithFeeding,
      complianceRate,
    };

    const summary = [
      `Feeding Summary:`,
      `  Available feeding routines: ${result.availableFeedingRoutines} (${result.routineNames.join(', ') || 'none'})`,
      `  Days analysed: ${totalDays}`,
      `  Days with feeding routine logged: ${daysWithFeeding}`,
      `  Compliance rate: ${complianceRate}%`,
    ].join('\n');

    return { summary, data: result };
  },
};

// ---------------------------------------------------------------------------
// Tool: getMilestoneProgress
// ---------------------------------------------------------------------------
TOOLS.getMilestoneProgress = {
  description: 'Summarises milestone completion by category.',
  requiredParams: ['infantId'],

  execute: async ({ infantId }) => {
    const infant = await Infant.findById(infantId)
      .populate('milestones.milestoneId')
      .lean();

    if (!infant) {
      return { summary: 'Infant not found.', data: {} };
    }

    if (!infant.milestones || infant.milestones.length === 0) {
      return { summary: 'No milestones assigned to this infant.', data: { total: 0 } };
    }

    // Group by category and status
    const byCategory = {};
    const byStatus = {};

    infant.milestones.forEach(m => {
      const cat = m.milestoneId?.category || 'Unknown';
      const status = m.status || 'Not Started';

      if (!byCategory[cat]) byCategory[cat] = { total: 0, achieved: 0, mastered: 0 };
      byCategory[cat].total++;
      if (status === 'Achieved') byCategory[cat].achieved++;
      if (status === 'Mastered') byCategory[cat].mastered++;

      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Overall completion percentage (Achieved + Mastered)
    const completed = (byStatus['Achieved'] || 0) + (byStatus['Mastered'] || 0);
    const total = infant.milestones.length;
    const completionRate = parseFloat(((completed / total) * 100).toFixed(1));

    const result = {
      total,
      byStatus,
      byCategory,
      completionRate,
    };

    const lines = [`Milestone Progress (${total} total, ${completionRate}% completed):`];
    Object.entries(byCategory).forEach(([cat, stats]) => {
      lines.push(`  ${cat}: ${stats.total} total, ${stats.achieved} achieved, ${stats.mastered} mastered`);
    });
    lines.push(`Status breakdown: ${Object.entries(byStatus).map(([s, c]) => `${s}: ${c}`).join(', ')}`);

    return { summary: lines.join('\n'), data: result };
  },
};

// ---------------------------------------------------------------------------
// Tool: getSchemes
// ---------------------------------------------------------------------------
TOOLS.getSchemes = {
  description: 'Fetches government schemes, optionally filtered by state.',
  requiredParams: [],

  execute: async ({ stateScope } = {}) => {
    const query = stateScope ? { stateScope: { $regex: stateScope, $options: 'i' } } : {};
    const schemes = await Scheme.find(query).lean();

    if (schemes.length === 0) {
      return {
        summary: stateScope
          ? `No schemes found for state: ${stateScope}`
          : 'No government schemes found in the database.',
        data: { count: 0, schemes: [] },
      };
    }

    const lines = [`Government Schemes (${schemes.length} found):`];
    schemes.forEach(s => {
      lines.push(`  - ${s.name} (${s.type}, ${s.stateScope})`);
      lines.push(`    Eligibility: ${s.eligibility}`);
      lines.push(`    Benefits: ${s.benefits?.substring(0, 120)}`);
    });

    return {
      summary: lines.join('\n'),
      data: {
        count: schemes.length,
        schemes: schemes.map(s => ({
          name: s.name,
          type: s.type,
          stateScope: s.stateScope,
          eligibility: s.eligibility,
          benefits: s.benefits,
          officialLink: s.officialLink,
        })),
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Tool dispatcher — decides which tools to run based on the user query
// ---------------------------------------------------------------------------

/**
 * Analyse the user query and run relevant tools.
 * 
 * @param {string} query    - The user's question
 * @param {object} params   - { infantId, stateScope, ... }
 * @returns {Promise<{ toolsUsed: string[], outputs: object[] }>}
 */
const runRelevantTools = async (query, params = {}) => {
  const q = (query || '').toLowerCase();
  const toolsUsed = [];
  const outputs = [];

  const run = async (name) => {
    try {
      const result = await TOOLS[name].execute(params);
      toolsUsed.push(name);
      outputs.push({ tool: name, ...result });
    } catch (err) {
      console.error(`[Tool] ${name} failed:`, err.message);
      outputs.push({ tool: name, summary: `Error: ${err.message}`, data: {} });
      toolsUsed.push(name);
    }
  };

  // Keyword-based tool selection
  if (params.infantId) {
    if (/growth|trend|weight|height|head\s*circumference|grow/i.test(q)) {
      await run('getGrowthTrend');
    }
    if (/sleep|nap|bedtime|night/i.test(q)) {
      await run('getSleepAnalysis');
    }
    if (/feed|feeding|food|eat|nutrition|meal|breast|bottle|formula/i.test(q)) {
      await run('getFeedingSummary');
    }
    if (/milestone|progress|development|skill|achieve/i.test(q)) {
      await run('getMilestoneProgress');
    }
  }

  if (/scheme|government|benefit|subsidy|programme|program|eligible/i.test(q)) {
    await run('getSchemes');
  }

  return { toolsUsed, outputs };
};

module.exports = { runRelevantTools, TOOLS };
