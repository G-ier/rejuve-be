exports.up = function(knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable('visits', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('client_id').notNullable();        // e.g., Auth0 user ID
      table.string('program_id').notNullable();         // the treatment or program ID
      table.jsonb('form_data').defaultTo('{}');         // stores questions & answers as a JSON object
      table.boolean('completed').defaultTo(false);      // flag to indicate if visit is complete
      table.timestamps(true, true);                     // created_at and updated_at
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('visits');
};
  