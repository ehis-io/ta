const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { randomBytes } = require('@app-core/randomness');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCreatorCard = require('@app/services/utils/serialize-creator-card');
const {
  SUFFIX_LENGTH,
  isValidSlugCharset,
  isValidAccessCode,
  isValidUrl,
  slugifyTitle,
  appendSlugSuffix,
} = require('@app/services/utils/creator-card-helpers');
const CARD_ERROR_CODE = require('./card-error-codes');

// Field-level validation. Charset/format rules the DSL cannot express
// (slug characters, access_code alphanumerics, url scheme, integer amounts)
// are enforced in the business logic below.
const spec = `root {
  title string<trim|lengthBetween:3,100>
  description? string<trim|maxLength:500>
  slug? string<trim|lengthBetween:5,50>
  creator_reference string<length:20>
  links[]? {
    title string<trim|lengthBetween:1,100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|lengthBetween:3,100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim>
}`;

const parsedSpec = validator.parse(spec);

async function isSlugTaken(slug) {
  const existing = await CreatorCard.findOne({ query: { slug } });
  return Boolean(existing);
}

/**
 * Resolve the slug to persist: validate a client-provided slug for uniqueness,
 * or auto-generate one from the title when omitted.
 * @returns {Promise<String>}
 */
async function resolveSlug(data) {
  let slug;

  if (data.slug !== undefined) {
    if (!isValidSlugCharset(data.slug)) {
      throwAppError(CreatorCardMessages.INVALID_SLUG_CHARACTERS, ERROR_CODE.VALIDATIONERR);
    }

    // A client-provided slug is never silently modified; collisions are an error.
    if (await isSlugTaken(data.slug)) {
      throwAppError(CreatorCardMessages.SLUG_TAKEN, CARD_ERROR_CODE.SLUG_TAKEN);
    }

    slug = data.slug;
  } else {
    const base = slugifyTitle(data.title);
    let candidate = base;

    // Append a random suffix when the base is too short or already taken,
    // retrying until a free slug is found.
    let needsSuffix = candidate.length < 5 || (await isSlugTaken(candidate));

    while (needsSuffix) {
      candidate = appendSlugSuffix(base, randomBytes(SUFFIX_LENGTH));
      // eslint-disable-next-line no-await-in-loop
      needsSuffix = await isSlugTaken(candidate);
    }

    slug = candidate;
  }

  return slug;
}

/**
 * Enforce the conditional access_code business rules and return the access
 * code (or undefined) to persist.
 */
function resolveAccessControls(data) {
  const accessType = data.access_type || 'public';
  const hasAccessCode = typeof data.access_code === 'string' && data.access_code.length > 0;

  if (accessType === 'private') {
    if (!hasAccessCode) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, CARD_ERROR_CODE.ACCESS_CODE_REQUIRED);
    }
    if (!isValidAccessCode(data.access_code)) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.VALIDATIONERR);
    }
  } else if (hasAccessCode) {
    throwAppError(
      CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED,
      CARD_ERROR_CODE.ACCESS_CODE_NOT_ALLOWED
    );
  }

  return { accessType, accessCode: accessType === 'private' ? data.access_code : undefined };
}

/**
 * Validate the structure of links and service_rates beyond what the DSL covers.
 */
function validateCollections(data) {
  if (Array.isArray(data.links)) {
    data.links.forEach((link) => {
      if (!isValidUrl(link.url)) {
        throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
      }
    });
  }

  if (data.service_rates) {
    const { rates } = data.service_rates;

    if (!Array.isArray(rates) || rates.length === 0) {
      throwAppError(CreatorCardMessages.EMPTY_SERVICE_RATES, ERROR_CODE.VALIDATIONERR);
    }

    rates.forEach((rate) => {
      if (!Number.isInteger(rate.amount) || rate.amount < 1) {
        throwAppError(CreatorCardMessages.INVALID_RATE_AMOUNT, ERROR_CODE.VALIDATIONERR);
      }
    });
  }
}

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let response;

  try {
    validateCollections(data);

    const { accessType, accessCode } = resolveAccessControls(data);
    const slug = await resolveSlug(data);

    const created = await CreatorCard.create({
      title: data.title,
      description: data.description,
      slug,
      creator_reference: data.creator_reference,
      links: data.links,
      service_rates: data.service_rates,
      status: data.status,
      access_type: accessType,
      access_code: accessCode,
    });

    response = serializeCreatorCard(created, { includeAccessCode: true });
  } catch (error) {
    appLogger.error({ error: error.message }, 'create-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = createCreatorCard;
