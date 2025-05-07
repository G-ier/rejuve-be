exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.string('client_id');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('client_id');
    });
  };
  