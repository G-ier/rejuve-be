const DatabaseRepository = require('../../../shared/services/databaseRepository');

class UserRepository {
    constructor() {
      this.table = 'users';
      this.db = new DatabaseRepository();
    }

    async createUser(userData) {
        const newUser = await this.db.insert(this.table, userData);
        return newUser.id; 
    }

    async updateUser(id, userData) {
        try {
            // Define the fields that are allowed to be updated
            const allowedFields = [
              'first_name',
              'last_name',
              'email',
              'skipped_email',
              'phone_number',
              'record_identifier',
              'additional_record_identifier',
              'height'
            ];

            const filteredData = Object.keys(userData).reduce((acc, key) => {
              if (allowedFields.includes(key)) {
                acc[key] = userData[key];
              }
              return acc;
            }, {});
        
            const updatedUser = await this.db.update(this.table, { id }, filteredData);
            return updatedUser;
          } catch (error) {
            throw new ApiError(500, 'Error updating user in repository');
          }
    }

    async getUserById(userId) {
      return this.db.queryOne(this.table, ['*'], { id: userId });
    }
}

module.exports = UserRepository;
