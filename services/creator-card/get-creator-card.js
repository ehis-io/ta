const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCreatorCard = require('@app/services/utils/serialize-creator-card');
const CARD_ERROR_CODE = require('./card-error-codes');

const spec = `root {
  slug string<trim>
  access_code? string<trim>
}`;

const parsedSpec = validator.parse(spec);

/**
 * Retrieve a Creator Card by slug, applying the public-access rules in order:
 *  1. NF01 (404) - no card with that slug (soft-deleted cards are excluded).
 *  2. NF02 (404) - the card exists but is a draft.
 *  3. AC03 (403) - private card with no access_code supplied.
 *  4. AC04 (403) - private card with an incorrect access_code.
 *  5. 200       - the card data (access_code is never exposed).
 */
async function getCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let response;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });

    if (!card) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, CARD_ERROR_CODE.NOT_FOUND);
    }

    if (card.status === 'draft') {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, CARD_ERROR_CODE.DRAFT_NOT_FOUND);
    }

    if (card.access_type === 'private') {
      const suppliedCode = data.access_code;

      if (!suppliedCode) {
        throwAppError(CreatorCardMessages.CARD_PRIVATE, CARD_ERROR_CODE.ACCESS_CODE_MISSING);
      }

      if (suppliedCode !== card.access_code) {
        throwAppError(
          CreatorCardMessages.INVALID_ACCESS_CODE_VALUE,
          CARD_ERROR_CODE.ACCESS_CODE_INVALID
        );
      }
    }

    response = serializeCreatorCard(card, { includeAccessCode: false });
  } catch (error) {
    appLogger.error({ error: error.message }, 'get-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = getCreatorCard;
