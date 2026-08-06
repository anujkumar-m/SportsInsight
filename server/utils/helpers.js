// ─── utils/helpers.js ─────────────────────────────────────────
'use strict';

/**
 * Generate a unique code like ATH-20240001
 */
const generateCode = async (prefix, conn) => {
  const year = new Date().getFullYear();
  const table = prefix === 'ATH' ? 'athletes' : prefix === 'COA' ? 'coaches' : 'selectors';
  const codeCol = prefix === 'ATH' ? 'athlete_code' : prefix === 'COA' ? 'coach_code' : 'selector_code';

  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM ${table} WHERE ${codeCol} LIKE ?`,
    [`${prefix}-${year}%`]
  );
  const seq = String(row.cnt + 1).padStart(4, '0');
  return `${prefix}-${year}${seq}`;
};

/**
 * Safely parse page/limit from query string
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(5, parseInt(query.limit) || 20));
  return { page, limit };
};

module.exports = { generateCode, parsePagination };
