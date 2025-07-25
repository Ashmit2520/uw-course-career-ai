// src/app/scripts/prereqParser.js

function clean(text) {
  if (!text) return '';
  // Replace non-breaking spaces and weird unicode with spaces
  return text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

// Split on known conjunctions, with or without spaces
function splitOnConjunctions(prereq, conj) {
  // e.g., conj = 'or' or 'and'
  // Match: "or", " or ", "orSPANISH", "or SPANISH"
  const regex = new RegExp(`\\s*${conj}\\s*`, 'gi');
  return prereq.split(regex);
}

// Expands 'CHICLA/SPANISH 222' to ['CHICLA 222', 'SPANISH 222']
function expandAliases(str) {
  const match = str.match(/^([\w&\/]+)\s+(\d+[A-Z]?)/i);
  if (!match) return [str.trim()];
  const [_, subjectAliases, num] = match;
  return subjectAliases.split('/').map(s => `${s.trim()} ${num}`);
}

// Normalize by putting spaces around 'and'/'or'/'(' and ')'
function normalize(text) {
  return clean(text)
    .replace(/([a-zA-Z0-9\)])(and|or)(?=[A-Z\(])/g, '$1 $2 ')
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Try to parse a prereq string recursively
function parse(prereq) {
  prereq = clean(prereq);
  if (!prereq || prereq.toLowerCase() === 'none') {
    return { type: "and", requirements: [], nonCourseRequirements: [] };
  }

  // Non-course requirements (add more as you see fit)
  const standingMatch = prereq.match(/\b(sophomore|junior|senior|graduate\/?professional) standing\b/i);
  const consentMatch = prereq.match(/\bconsent of (the )?instructor\b/i);

  if (/declared in/i.test(prereq)) {
    return {
      type: "and",
      requirements: [],
      nonCourseRequirements: ["declared major/certificate/special student"],
    };
  }

  if (standingMatch) {
    return {
      type: "and",
      requirements: [],
      nonCourseRequirements: [standingMatch[0].toLowerCase()],
    };
  }
  if (consentMatch) {
    return {
      type: "and",
      requirements: [],
      nonCourseRequirements: ["consent of instructor"],
    };
  }
  // If it's just a sentence (no numbers/courses)
  if (!/\d{2,}/.test(prereq) && !standingMatch && !consentMatch) {
    return {
      type: "ambiguous",
      text: prereq.trim(),
      requirements: [],
      nonCourseRequirements: [],
    };
  }

  // Normalize for parsing
  prereq = normalize(prereq);

  // Handle parentheses first (recursive)
  if (prereq.includes('(')) {
    // Split on 'and' at the root level
    let depth = 0, start = 0, tokens = [], buf = '';
    for (let i = 0; i < prereq.length; ++i) {
      let c = prereq[i];
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth === 0 && prereq.slice(i, i+4).toLowerCase() === ' and') {
        tokens.push(prereq.slice(start, i).trim());
        start = i + 4;
        i += 3;
      }
    }
    tokens.push(prereq.slice(start).trim());

    if (tokens.length > 1) {
      return {
        type: "and",
        requirements: tokens.map(parse).filter(r => r.type !== "and" || r.requirements.length),
        nonCourseRequirements: [],
      };
    }
    // If not AND, try OR at root level
    depth = 0; start = 0; tokens = [];
    for (let i = 0; i < prereq.length; ++i) {
      let c = prereq[i];
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth === 0 && prereq.slice(i, i+3).toLowerCase() === ' or') {
        tokens.push(prereq.slice(start, i).trim());
        start = i + 3;
        i += 2;
      }
    }
    tokens.push(prereq.slice(start).trim());

    if (tokens.length > 1) {
      return {
        type: "or",
        requirements: tokens.map(parse).filter(r => r.type !== "and" || r.requirements.length),
        nonCourseRequirements: [],
      };
    }
    // Unwrap parentheses and try again
    if (prereq.startsWith('(') && prereq.endsWith(')')) {
      return parse(prereq.slice(1, -1).trim());
    }
  }

  // Split on 'and'/'or' not inside parentheses
  let tokens;
  if (prereq.includes(' or ')) {
    tokens = splitOnConjunctions(prereq, 'or');
    return {
      type: "or",
      requirements: tokens.map(parse).filter(r => r.type !== "and" || r.requirements.length),
      nonCourseRequirements: [],
    };
  }
  if (prereq.includes(' and ')) {
    tokens = splitOnConjunctions(prereq, 'and');
    return {
      type: "and",
      requirements: tokens.map(parse).filter(r => r.type !== "and" || r.requirements.length),
      nonCourseRequirements: [],
    };
  }

  // Expand course aliases: e.g., "CHICLA/SPANISH 222"
  let match = prereq.match(/^([\w&\/]+)\s+(\d+[A-Z]?)/);
  if (match) {
    let aliases = expandAliases(match[0]);
    if (aliases.length === 1) {
      return { type: "course", course: aliases[0], nonCourseRequirements: [] };
    } else {
      return {
        type: "or",
        requirements: aliases.map(c => ({ type: "course", course: c, nonCourseRequirements: [] })),
        nonCourseRequirements: [],
      };
    }
  }

  // If it looks like a single course (e.g., "MATH 221")
  match = prereq.match(/^([A-Z][A-Z&\/ ]+)\s+(\d+[A-Z]?)/i);
  if (match) {
    return { type: "course", course: `${match[1].trim()} ${match[2]}`, nonCourseRequirements: [] };
  }

  // If nothing matches, mark as ambiguous
  return {
    type: "ambiguous",
    text: prereq.trim(),
    requirements: [],
    nonCourseRequirements: [],
  };
}

module.exports = parse;
