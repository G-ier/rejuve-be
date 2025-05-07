// External Imports
const axios = require('axios');

// Internal Imports
const EnvironmentVariablesManager = require('../../../../shared/services/EnvironmentVariablesManager');
const { ClientLogger } = require('../../../../shared/lib/WinstonLogger');

require('dotenv').config();

class FormService {

    constructor() {
        this.type = "intake-initial"; // other types: intake-followup
        this.formUrl = EnvironmentVariablesManager.getEnvVariable('OLH_CREATE_FORM_URL_STAGING');
        this.formId = EnvironmentVariablesManager.getEnvVariable('INITIAL_INTAKE_FORM_ID');
        this.mwlModality = "async_visit";
        this.logger = ClientLogger;
    }

    async uploadFormAnswers(answers) {
        try {
            // Validate that answers is not null or undefined
            if (!answers) {
                throw new Error('Form answers cannot be null or undefined');
            }
            
            // Reconstruct the answers object to match the expected format
            // Convert non q{number}_ keys to q{number}_ format
            const reformattedAnswers = {};
            
            // Special fields for payload data object
            const specialFields = ['patient_id', 'shipping_address_line_1', 'shipping_city', 'shipping_state', 'shipping_zip'];
            
            // Process each answer key
            const questionKeys = [];
            Object.keys(answers).forEach(key => {
                if (specialFields.includes(key)) {
                    // Keep special fields as is
                    reformattedAnswers[key] = answers[key];
                } else if (!key.match(/^q\d+_/)) {
                    // Add q{number}_ prefix if it doesn't exist
                    // For now, we'll assign a default question number for demonstration
                    // In a real implementation, you'd need logic to determine the correct number
                    const newKey = `q99_${key}`;
                    reformattedAnswers[newKey] = answers[key];
                    questionKeys.push(newKey);
                } else {
                    // It already has proper format
                    reformattedAnswers[key] = answers[key];
                    questionKeys.push(key);
                }
            });
            
            // Sort keys based on the number in q{number}_
            questionKeys.sort((a, b) => {
                const numA = parseInt(a.match(/q(\d+)_/)[1]);
                const numB = parseInt(b.match(/q(\d+)_/)[1]);
                return numA - numB;
            });
            
            // Create the final ordered answers object
            const orderedAnswers = {};
            
            // Add special fields first
            specialFields.forEach(field => {
                if (reformattedAnswers[field] !== undefined) {
                    orderedAnswers[field] = reformattedAnswers[field];
                }
            });
            
            // Add question fields in order
            questionKeys.forEach(key => {
                orderedAnswers[key] = reformattedAnswers[key];
            });
            
            const payload = {
                data: {
                    patient_id: answers.patient_id,
                    formReferenceId: this.formId,
                    mwl_modality: this.mwlModality,
                    shipping_address_line_1: answers.shipping_address_line_1,
                    shipping_city: answers.shipping_city,
                    shipping_state: answers.shipping_state,
                    shipping_zip: answers.shipping_zip,
                    ...orderedAnswers
                }
            };
            
            const response = await axios.post(this.formUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            //console.log(response.data);
            
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = FormService; 