exports.up = function (knex) {
    return knex.schema.createTable('orders', function (table) {
      table.increments('id').primary();
      table.string('patient_id').notNullable();   
      table.string('order_number').notNullable().unique();
      table.string('tracking_number').nullable();
      table.decimal('total', 10, 2).defaultTo(0);
      table.decimal('amount_paid', 10, 2).defaultTo(0);
      table.string('shipping_address').nullable();
      table.string('shipping_city').nullable();
      table.string('shipping_state').nullable();
      table.string('shipping_zip').nullable();
      table.timestamps(true, true); 
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTableIfExists('orders');
  };
  