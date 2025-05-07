exports.up = function(knex) {
    return knex.schema.table('orders', function(table) {
      table.dropColumn('shipping_address');
      table.dropColumn('shipping_city');
      table.dropColumn('shipping_state');
      table.dropColumn('shipping_zip');
  
      table.integer('shipping_address_id').unsigned().references('id').inTable('shipping_addresses');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('orders', function(table) {
      table.string('shipping_address');
      table.string('shipping_city');
      table.string('shipping_state');
      table.string('shipping_zip');
  
      table.dropColumn('shipping_address_id');
    });
  };
  