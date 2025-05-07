const DatabaseRepository = require('../../../shared/services/databaseRepository');

class ClientRepository {
    constructor() {
      this.table = 'clients';
      this.db = new DatabaseRepository();
    }

    async createClient(clientData) {
        try {
          await this.db.insert(this.table, clientData);
        } catch (error) {
          console.log(error);
        }
    }

    async updateClient(id, clientData) {
        try {
            // Define the fields that are allowed to be updated
            const allowedFields = [
              'first_name',
              'last_name',
              'email',
              'phone_number',
              'address',
              'company',
              'notes'
            ];

            const filteredData = Object.keys(clientData).reduce((acc, key) => {
              if (allowedFields.includes(key)) {
                acc[key] = clientData[key];
              }
              return acc;
            }, {});
        
            const updatedClient = await this.db.update(this.table, { id }, filteredData);
            return updatedClient;
          } catch (error) {
            throw error;
          }
    }

    async getClientById(clientId) {
      try {
        return this.db.queryOne(this.table, ['*'], { id: clientId });
      } catch (error) {
        throw error;
      }
    }

    async getAllClients() {
      try {
        return this.db.query(this.table, ['*']);
      } catch (error) {
        throw error;
      }
    }
}

module.exports = ClientRepository; 