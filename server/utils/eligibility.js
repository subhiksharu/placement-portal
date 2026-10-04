// Lowercase and trim so "CSE", "cse " and "Cse" all match
const norm = (s) => String(s || '').trim().toLowerCase();

/**
 * Checks one student profile against one job's eligibility rules.
 * Returns { eligible: boolean, reasons: string[] }
 */
const checkEligibility = (profile, job) => {
  const reasons = [];
  const rules = job.eligibility || {};

  // Rule 1: minimum CGPA
  if (profile.cgpa < (rules.minCgpa || 0)) {
    reasons.push(`CGPA ${profile.cgpa} is below the required ${rules.minCgpa}`);
  }

  // Rule 2: maximum backlogs
  if (profile.backlogs > (rules.maxBacklogs ?? 0)) {
    reasons.push(
      `${profile.backlogs} backlog(s) exceeds the allowed ${rules.maxBacklogs ?? 0}`
    );
  }

  // Rule 3: department (empty list means all departments are allowed)
  if (rules.departments && rules.departments.length > 0) {
    const allowed = rules.departments.map(norm);
    if (!allowed.includes(norm(profile.department))) {
      reasons.push(`Open only to: ${rules.departments.join(', ')}`);
    }
  }

  // Rule 4: batch (empty means any batch)
  if (rules.batch && rules.batch !== profile.batch) {
    reasons.push(`Only for the ${rules.batch} batch`);
  }

  return { eligible: reasons.length === 0, reasons };
};

/**
 * How many of the job's required skills the student has.
 * Returns { percent, matched[], missing[] }
 */
const skillMatch = (studentSkills = [], requiredSkills = []) => {
  if (requiredSkills.length === 0) {
    return { percent: 100, matched: [], missing: [] };
  }

  const have = new Set(studentSkills.map(norm));
  const matched = requiredSkills.filter((s) => have.has(norm(s)));
  const missing = requiredSkills.filter((s) => !have.has(norm(s)));

  return {
    percent: Math.round((matched.length / requiredSkills.length) * 100),
    matched,
    missing,
  };
};

module.exports = { checkEligibility, skillMatch };