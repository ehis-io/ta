/**
 * Serialize a Creator Card database document into its API representation.
 *
 * Responsibilities:
 *  - Expose the Mongo `_id` as `id` (the `_id` field never leaks).
 *  - Normalize the paranoid `deleted` sentinel (0) to `null`.
 *  - Include `access_code` only when explicitly requested (creation/deletion
 *    responses) and never on public retrieval responses.
 *
 * @param {Object} card - Raw card document (lean object from the repository).
 * @param {Object} [options]
 * @param {Boolean} [options.includeAccessCode=false] - Whether to expose access_code.
 * @returns {Object} The serialized, API-safe card.
 */
function serializeCreatorCard(card, options = {}) {
  const { includeAccessCode = false } = options;

  const serialized = {
    id: card._id,
    title: card.title,
    description: card.description,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links,
    service_rates: card.service_rates,
    status: card.status,
    access_type: card.access_type,
  };

  if (includeAccessCode) {
    serialized.access_code = card.access_code ? card.access_code : null;
  }

  serialized.created = card.created;
  serialized.updated = card.updated;
  serialized.deleted = card.deleted ? card.deleted : null;

  return serialized;
}

module.exports = serializeCreatorCard;
