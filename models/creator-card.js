const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator_cards';

/**
 * @typedef {Object} CreatorCardModel
 * @property {String} _id - ULID. Serialized as `id` in API responses.
 * @property {String} title
 * @property {String} [description]
 * @property {String} slug - Unique public identifier.
 * @property {String} creator_reference
 * @property {Array<{title:String, url:String}>} [links]
 * @property {Object} [service_rates]
 * @property {String} status - draft | published
 * @property {String} access_type - public | private
 * @property {String} [access_code]
 * @property {Number} created - Unix epoch milliseconds.
 * @property {Number} updated - Unix epoch milliseconds.
 * @property {Number} deleted - 0 while active, deletion timestamp once soft-deleted.
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String, index: true },
  links: { type: SchemaTypes.Array },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String, index: true },
  access_type: { type: SchemaTypes.String },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number },
  updated: { type: SchemaTypes.Number },
  // `deleted` is added automatically by the paranoid plugin (defaults to 0).
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

// `paranoid: true` enables framework-managed soft deletion: queries exclude
// deleted records, deleteOne stamps `deleted` with a timestamp, and the unique
// `slug` is automatically mangled on deletion so the value can be reused.
/** @type {CreatorCardModel} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
