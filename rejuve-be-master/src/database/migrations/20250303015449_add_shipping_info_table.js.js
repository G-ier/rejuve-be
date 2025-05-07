exports.up = function(knex) {
    return knex.schema.createTable('shipping_addresses', function(table) {
      table.increments('id').primary();     
      table.string('user_id').notNullable(); 
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('street_address').notNullable();
      table.string('apt_suite').nullable();
      table.string('city').notNullable();
      table.string('state').notNullable();
      table.string('zip').notNullable();
      table.string('country').notNullable();
      table.string('phone').nullable();
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('shipping_addresses');
  };
  