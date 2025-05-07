exports.up = function(knex) {
    return knex.schema.table('eligibility_criteria', function(table) {
      table.string('code');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('eligibility_criteria', function(table) {
      table.dropColumn('code');
    });
  };
  