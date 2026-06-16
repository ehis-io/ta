/**
 * Custom business-rule error codes for the Creator Card service.
 *
 * These codes are surfaced to clients as the `code` field of error responses
 * and are mapped to their HTTP statuses in `core/errors/constants.js`
 * (ERROR_STATUS_CODE_MAPPING).
 *
 * @readonly
 * @enum {String}
 */
const CARD_ERROR_CODE = {
  SLUG_TAKEN: 'SL02', // 400 - slug already taken
  ACCESS_CODE_REQUIRED: 'AC01', // 400 - private card missing access_code
  ACCESS_CODE_NOT_ALLOWED: 'AC05', // 400 - public card with access_code
  NOT_FOUND: 'NF01', // 404 - card does not exist (or deleted)
  DRAFT_NOT_FOUND: 'NF02', // 404 - card exists but is a draft
  ACCESS_CODE_MISSING: 'AC03', // 403 - private card, no access_code supplied
  ACCESS_CODE_INVALID: 'AC04', // 403 - private card, wrong access_code
};

module.exports = CARD_ERROR_CODE;
