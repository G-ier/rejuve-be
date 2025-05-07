/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('clients', (table) => {
    table.string('client_id').notNullable().primary();
    table.string('first_name');
    table.string('last_name');
    table.string('email');
    table.string('phone_number');
    table.string('dietitian_id');
    table.string('user_group_id');
    table.string('record_identifier');
    table.string('additional_record_identifier');
    table.string('height');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('clients');
};
