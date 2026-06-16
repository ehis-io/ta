const CreatorCardMessages = {
  // Field-level validation (handled mostly by the VSL validator -> HTTP 400)
  INVALID_SLUG_CHARACTERS:
    'Slug may only contain letters, numbers, hyphens (-) and underscores (_)',
  INVALID_ACCESS_CODE: 'access_code must be exactly 6 alphanumeric characters',
  EMPTY_SERVICE_RATES: 'service_rates.rates must be a non-empty array',
  INVALID_RATE_AMOUNT: 'Each rate amount must be a positive integer (minor units)',
  INVALID_LINK_URL: 'Each link url must start with http:// or https://',

  // Business rule errors (custom codes)
  SLUG_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED: 'access_code is required when access_type is private',
  ACCESS_CODE_NOT_ALLOWED: 'access_code can only be set on private cards',
  CARD_NOT_FOUND: 'Creator card not found',
  CARD_PRIVATE: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE_VALUE: 'Invalid access code',
};

module.exports = CreatorCardMessages;
