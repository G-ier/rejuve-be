const DatabaseConnection = require('../../../shared/services/DatabaseConnection');
const DatabaseRepository = require('../../../shared/services/databaseRepository');

class shippingAddressRepository {
  constructor() {
    this.db = new DatabaseRepository();
    this.knex = DatabaseConnection.getConnection();
  }

  async createAddress(addressData) {
    const [newAddress] = await this.knex('shipping_addresses')
      .insert(addressData)
      .returning('*');
    return newAddress;
  }

  async getAddressesByPatientId(id) {
    const addresses = await this.knex('shipping_addresses')
      .select('*')
      .where('id', id);
    return addresses;
  }
}

module.exports = new shippingAddressRepository();
