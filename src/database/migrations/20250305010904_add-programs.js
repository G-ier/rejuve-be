exports.up = function(knex) {
    return knex.schema
      // Create the programs table
      .createTable('programs', function(table) {
        table.increments('id').primary();
        table.string('code').notNullable().unique();
        table.string('name').notNullable();
      })
      // Create the program_forms table
      .createTable('program_forms', function(table) {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('form_id').notNullable().unique();
        table.string('program_code').notNullable();
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('program_forms')
      .dropTableIfExists('programs');
  };
  