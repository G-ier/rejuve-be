const axios = require('axios');
const healthieAPI = require('../../../../config/healthie');

class HealthieOrderService {
  async createOrderInHealthie(orderData) {
    try {
      const response = await healthieAPI.post('/orders', orderData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Healthie API service is unavailable');
    }
  }

  async getOrdersFromHealthie(userId) {
    try {
      const response = await healthieAPI.get(`/users/${userId}/orders`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error('Healthie API service is unavailable');
    }
  }
}

module.exports = new HealthieOrderService(); 