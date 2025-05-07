exports.up = function(knex) {
    return knex.schema.createTable('medications', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.integer('program_id').notNullable();
      table.timestamps(true, true); 
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('medications');
  };
  