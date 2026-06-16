const SLUG_MAX_LENGTH = 50;
const SUFFIX_LENGTH = 6;

function isLetter(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isWhitespace(ch) {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
}

/**
 * Validate that a (client-supplied) slug only contains allowed characters:
 * letters, numbers, hyphens and underscores.
 * @param {String} slug
 * @returns {Boolean}
 */
function isValidSlugCharset(slug) {
  if (typeof slug !== 'string' || slug.length === 0) return false;

  return slug.split('').every((ch) => isLetter(ch) || isDigit(ch) || ch === '-' || ch === '_');
}

/**
 * Validate that an access code is exactly 6 alphanumeric characters.
 * @param {String} code
 * @returns {Boolean}
 */
function isValidAccessCode(code) {
  if (typeof code !== 'string' || code.length !== 6) return false;

  return code.split('').every((ch) => isLetter(ch) || isDigit(ch));
}

/**
 * Validate that a link URL starts with http:// or https://.
 * @param {String} url
 * @returns {Boolean}
 */
function isValidUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Build a base slug from a title per the assessment rules:
 *  1. Lowercase the title.
 *  2. Replace whitespace with hyphens.
 *  3. Remove characters that are not letters, numbers, hyphens or underscores.
 * Consecutive hyphens are collapsed and edge hyphens trimmed for cleanliness.
 * @param {String} title
 * @returns {String}
 */
function slugifyTitle(title) {
  const lowered = String(title).toLowerCase().trim();

  let out = '';
  let lastWasHyphen = false;

  lowered.split('').forEach((ch) => {
    if (isLetter(ch) || isDigit(ch) || ch === '_') {
      out += ch;
      lastWasHyphen = false;
    } else if ((isWhitespace(ch) || ch === '-') && !lastWasHyphen) {
      // collapse runs of whitespace / hyphens into a single hyphen
      out += '-';
      lastWasHyphen = true;
    }
    // any other character is dropped
  });

  // trim leading / trailing hyphens
  while (out.startsWith('-')) out = out.slice(1);
  while (out.endsWith('-')) out = out.slice(0, -1);

  return out.slice(0, SLUG_MAX_LENGTH);
}

/**
 * Append a random alphanumeric suffix to a base slug while respecting the
 * maximum slug length.
 * @param {String} base
 * @param {String} suffix - random alphanumeric suffix (without the hyphen)
 * @returns {String}
 */
function appendSlugSuffix(base, suffix) {
  const maxBaseLength = SLUG_MAX_LENGTH - (suffix.length + 1); // +1 for the hyphen
  const trimmedBase = base.slice(0, Math.max(0, maxBaseLength));

  // trim a trailing hyphen left by the slice so we never produce `--suffix`
  const cleanBase = trimmedBase.endsWith('-') ? trimmedBase.slice(0, -1) : trimmedBase;

  return cleanBase ? `${cleanBase}-${suffix}` : suffix;
}

module.exports = {
  SLUG_MAX_LENGTH,
  SUFFIX_LENGTH,
  isValidSlugCharset,
  isValidAccessCode,
  isValidUrl,
  slugifyTitle,
  appendSlugSuffix,
};
