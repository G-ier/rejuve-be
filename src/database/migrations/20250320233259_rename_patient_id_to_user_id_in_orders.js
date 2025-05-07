exports.up = function(knex) {
    return knex.schema.table('orders', function(table) {
      table.renameColumn('patient_id', 'user_id');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('orders', function(table) {
      table.renameColumn('user_id', 'patient_id');
    });
  };
  