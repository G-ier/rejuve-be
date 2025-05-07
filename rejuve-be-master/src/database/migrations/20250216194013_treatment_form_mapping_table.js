exports.up = function(knex) {
    return knex.schema.createTable('treatment_form_mapping', function(table) {
      table.increments('id').primary();
      table.string('treatment_id').notNullable();
      table.string('form_id').notNullable();
      table.string('code').nullable();
      table.timestamps(true, true);
      table.unique(['treatment_id', 'code']);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('treatment_form_mapping');
  };
  