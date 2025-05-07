const axios = require('axios');
const healthieAPI = require('../../../../config/healthie');
require('dotenv').config();

class HealthieUserService {
    async getUserFromHealthie(id) {
        try {
          const query = `
            query getUser($id: ID) {
              user(id: $id) {
                id
                first_name
                last_name
                dob
                gender
                email
                phone_number
                next_appt_date
                weight
                height
              }
            }
          `;
          const variables = { id };
          const response = await healthieAPI.post('', { query, variables });
          const user = response.data.data.user;
          return user;
        } catch (error) {
          if (error.response) {
            throw error;
          }
          throw new Error('Healthie API service is unavailable');
        }
    };

    async createEntryInHealthie(entryData) {
        try {
          const mutation = `
            mutation createEntry(
              $metric_stat: String, 
              $category: String,
              $type: String, 
              $user_id: String,
              $created_at: String
            ) {
              createEntry(input: {
                metric_stat: $metric_stat,
                category: $category,
                type: $type,
                user_id: $user_id,
                created_at: $created_at
              }) {
                entry {
                  id
                  category
                  type
                }
                messages {
                  field
                  message
                }
              }
            }
          `;
          
          const variables = {
            metric_stat: entryData.metric_stat,
            category: entryData.category,
            type: entryData.type,
            user_id: entryData.user_id,
            created_at: entryData.created_at,
          };
      
          const response = await healthieAPI.post('', { query: mutation, variables });
          // Check if the response contains errors
          if (response.data.errors && response.data.errors.length) {
            throw new Error(response.data.errors[0].message);
          }
          
          return response.data.data.createEntry;
        } catch (error) {
          if (error.response) {
            throw error;
          }
          throw new Error('Healthie API service is unavailable');
        }
    }
}

module.exports = new HealthieUserService(); 