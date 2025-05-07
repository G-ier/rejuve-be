// External dependencies
const axios = require("axios");
// Internal dependencies
const EnvironmentVariablesManager = require("../shared/services/EnvironmentVariablesManager");


// Environment variables
const healthieConfig = {
  baseURL: EnvironmentVariablesManager.getEnvVariable("HEALTHIE_API_URL"),
  headers: {
    Authorization: `Basic ${EnvironmentVariablesManager.getEnvVariable("HEALTHIE_API_KEY")}`,
    AuthorizationSource: "API"
  },
};

const healthieAPI = axios.create(healthieConfig);

module.exports = healthieAPI;