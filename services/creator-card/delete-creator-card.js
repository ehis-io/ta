const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCreatorCard = require('@app/services/utils/serialize-creator-card');
const CARD_ERROR_CODE = require('./card-error-codes');

const spec = `root {
  slug string<trim>
  creator_reference string<length:20>
}`;

const parsedSpec = validator.parse(spec);

/**
 * Soft-delete a Creator Card by slug. Returns the deleted card in the same
 * shape as the creation response (with the `deleted` timestamp populated).
 * Already-deleted / non-existent cards return NF01 (404).
 */
async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let response;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });

    if (!card) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, CARD_ERROR_CODE.NOT_FOUND);
    }

    const deletedAt = Date.now();

    // Paranoid soft-delete: stamps `deleted` and frees the unique slug so it
    // can be reused. We return the in-memory document with the timestamp set.
    await CreatorCard.deleteOne({ query: { _id: card._id } });
    card.deleted = deletedAt;

    response = serializeCreatorCard(card, { includeAccessCode: true });
  } catch (error) {
    appLogger.error({ error: error.message }, 'delete-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = deleteCreatorCard;
