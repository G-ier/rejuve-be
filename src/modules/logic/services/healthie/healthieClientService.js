// External Imports
require('dotenv').config();
// Internal Imports
const healthieAPI = require('../../../../config/healthie');
const EnvironmentVariablesManager = require('../../../../shared/services/EnvironmentVariablesManager');

class HealthieClientService {
    async createClient(userData) {
        const mutation = `
            mutation createClient($input: createClientInput!) {
                createClient(input: $input) {
                    user {
                        id
                        first_name
                        last_name
                        email
                        phone_number
                        dietitian_id
                        record_identifier
                        additional_record_identifier
                        height
                    }
                    messages {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            input: {
                first_name: userData.first_name ||  userData.email.split('@')[0],
                last_name: userData.last_name ||  userData.email.split('@')[0], 
                email: userData.email,
                phone_number: userData.phone_number,
                dietitian_id: EnvironmentVariablesManager.getEnvVariable('HEALTHIE_DIETITIAN_ID'), 
                skipped_email: EnvironmentVariablesManager.getEnvVariable('HEALTHIE_SKIPPED_EMAIL'),
                dont_send_welcome: EnvironmentVariablesManager.getEnvVariable('HEALTHIE_SEND_WELCOME_EMAIL'),
                additional_record_identifier: userData.additional_record_identifier || ""
            }
        };

        try {
            const response = await healthieAPI.post('', { query: mutation, variables });

            console.log(response.data);
            // Correct handling of status 200 errors
            if (response.data.errors && response.data.errors.length > 0) {
                console.log(JSON.stringify(response.data.errors, null, 2));
                const errors = response.data.errors.map(error => error.extensions.problems).join("\n");
                const error = new Error("Client creation error!");
                error.errors = errors;
                throw error;
            }
            // Secoond type error handling
            if (response.data.data.createClient.messages) {
                const error = new Error("Client creation error!");
                error.errors = response.data.data.createClient.messages;
                throw error;
            }
            
            return response.data.data.createClient;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async updateClientInHealthie(userId, userData) {
        const mutation = `
            mutation UpdateClient($input: updateClientInput!) {
                updateClient(input: $input) {
                    user {
                        id
                        first_name
                        last_name
                        email
                        dob
                        gender
                        height
                        primary_race_code
                        primary_ethnicity_code
                        phone_number
                        location {
                            id
                            city
                            state
                            zip
                            line1
                        }
                        locations {
                            id
                            city
                            state
                        }
                    }
                    messages {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            input: {
                id: userId,
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
                dob: userData.birthday,
                gender: userData.gender,
                height: String(userData.height),
                primary_race_code: userData.primary_race_code || "",
                primary_ethnicity_code: userData.primary_ethnicity_code || "",
                phone_number: userData.phone_number,
                location: userData.location || {},
                locations: userData.locations || []
            }
        };

        try {
            const response = await healthieAPI.post('', { query: mutation, variables });
            return response.data.data.updateClient;
        } catch (error) {
            throw error;
        }
    }

    async retrieveUserGroups(offset = 1) {
        const query = `
            query userGroups($offset: Int, $sort_by: String) {
                userGroups(offset: $offset, sort_by: $sort_by, should_paginate: true) {
                    id
                    name
                    users_count
                }
            }
        `;

        const variables = {
            offset: parseInt(offset, 10),
            sort_by: 'name'
        };

        try {
            const response = await healthieAPI.post('', { query, variables });
            console.log("response:");
            console.log(response);
            console.log("================================================");
            console.log("concrete errors:");
            console.log(response.data.errors ? response.data.errors[0].extensions.problems : "No errors");
            console.log("concrete data:");
            console.log(response.data);
            return response.data.data;   
        } catch (error) {
            throw error;
        }
    }
    
}

module.exports = HealthieClientService; 