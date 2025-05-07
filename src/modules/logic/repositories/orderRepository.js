const DatabaseConnection = require('../../../shared/services/DatabaseConnection');
const DatabaseRepository = require('../../../shared/services/databaseRepository');

class OrderRepository {
  constructor() {
    this.db = new DatabaseRepository();
    this.knex = DatabaseConnection.getConnection();
  }

  async create(orderData) {
    const [newOrder] = await this.knex('orders')
      .insert(orderData)
      .returning('*');
    return newOrder;
  }

  async getOrdersByPatientId(patientId) {
    try {
      const orders = await this.knex('orders')
        .select('*')
        .where('user_id', patientId);

      return orders;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrderRepository();
