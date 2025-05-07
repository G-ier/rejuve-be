exports.up = function(knex) {
    return knex.schema.createTable('eligibility_criteria', function(table) {
      table.increments('id').primary();
      table.string('treatment_id').notNullable(); 
      table.string('question_id').notNullable(); 
      table.string('operator').notNullable();
      table.string('value').notNullable();
      table.string('message').nullable();
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('eligibility_criteria');
  };
  