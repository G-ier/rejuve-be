// Load the AWS SDK
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const fs = require('fs');

class EnvironmentVariablesManager {
  static instance = null;
  static initialized = false;

  static secrets = [
    // Database
    'DATABASE_URL',
    'DATABASE_URL_STAGING',
    'DATABASE_URL_LOCAL',

    // AUTH0
    'AUTH0_AUDIENCE',
    'AUTH0_DOMAIN',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',

    // HEALTHIE
    'HEALTHIE_API_URL',
    'HEALTHIE_API_KEY',
    'HEALTHIE_DIETITIAN_ID'
  ];

  static parameters = [
    // Server settings
    'PORT',
    'DISABLE_AUTH_DEADLOCK',
    'HEALTHIE_SKIPPED_EMAIL',
    'HEALTHIE_SEND_WELCOME_EMAIL',
    'DATABASE_ENVIRONMENT',
    'OLH_CREATE_FORM_URL',
    'INITIAL_INTAKE_FORM_ID',
    'OLH_CREATE_FORM_URL_STAGING',
    'REFILL_INTAKE_FORM_ID'
  ];

  get isInitialized() {
    return !!this._initialized; // Use a private property _initialized for internal tracking
  }

  constructor() {
    if (!EnvironmentVariablesManager.instance) {
      // Check if the runtime environment is development or production
      this.environmentLocation =
        process.env.ENVIRONMENT_LOCATION === 'local' ? 'Local' : 'AWS Cloud';
      this.region = 'us-east-1';
      this.secretsManager = new SecretsManagerClient({
        region: this.region,
      });
      this.parametersManager = new SSMClient({
        region: this.region,
      });
      this.cachedValues = {}; // Object to hold cached secrets
      EnvironmentVariablesManager.instance = this;
    }
    return EnvironmentVariablesManager.instance;
  }

  // Retrieve a parameter from the AWS SSM Parameter Store
  async retrieveParameter(parameterName) {
    // Check if the parameter is stored in the parameters manager
    if (!EnvironmentVariablesManager.parameters.includes(parameterName)) {
      throw new Error(`No secret ${parameterName} stored in manager`);
    }

    try {
      const params = {
        Name: parameterName,
        WithDecryption: true,
      };
      const data = await this.parametersManager.send(new GetParameterCommand(params));

      // Parse the parameter value & store it in the cache
      const parameterValue = data.Parameter.Value;
      this.cachedValues[parameterName] = parameterValue;
      return parameterValue;
    } catch (error) {
      console.error(`Error retrieving parameter ${parameterName}: ${error}`);
      return null;
    }
  }

  // Retrieve a secret from the AWS Secrets Manager
  async retrieveSecret(secretName, singleValue = true) {
    // Check if the secret is stored in the manager
    if (!EnvironmentVariablesManager.secrets.includes(secretName)) {
      throw new Error(`No secret ${secretName} stored in manager`);
    }

    try {
      const params = {
        SecretId: secretName,
        VersionStage: 'AWSCURRENT', // VersionStage defaults to AWSCURRENT if unspecified
      };
      const data = await this.secretsManager.send(new GetSecretValueCommand(params));

      // Parse the secret value & store it in the cache
      const secretString = data.SecretString;
      const secretValue = secretString ? JSON.parse(secretString) : null;
      const value = singleValue && secretValue ? secretValue[secretName] : secretValue;
      this.cachedValues[secretName] = value;

      return value;
    } catch (error) {
      console.error(`Error retrieving secret ${secretName}: ${error}`);
      return null;
    }
  }

  // Initialize the service by retrieving all secrets
  async init() {
    if (this.environmentLocation === 'Local') {
      console.log("Initializing local server of variables.");
      const envVars = EnvironmentVariablesManager.secrets.concat(
        EnvironmentVariablesManager.parameters,
      );
      for (const secretName of envVars) {
        this.cachedValues[secretName] = process.env[secretName];
      }
    } else {
      const requiredEnvVariables = ['DATABASE_ENVIRONMENT', 'STACK'];

      // Overwriting the env variables with the ones from the file
      const dotenv = require('dotenv');
      const envFilePath = '/etc/profile.d/launcher-be-backend.env';

      const fileExists = fs.existsSync(envFilePath);
      const fileContent = fileExists ? fs.readFileSync(envFilePath, 'utf8').trim() : '';
      const envConfig = fileContent ? dotenv.parse(fileContent) : {};

      const missingVariables = requiredEnvVariables.filter((key) => !envConfig[key]);

      // Throw an error if any of the required env variables are missing
      if (missingVariables.length > 0) {
        throw new Error(`
          Missing required environment variables: ${missingVariables.join(', ')}.
          Please ensure it's/they are set in ${envFilePath}.

          Example:
          DATABASE_ENVIRONMENT=staging
          STACK=BE
        `);
      }

      // Throw an error if any of the required env variables is invalid
      if (!['staging', 'production', 'development'].includes(envConfig['DATABASE_ENVIRONMENT']))
        throw new Error(
          `DATABASE_ENVIRONMENT must be either 'staging', 'production' or 'development'`,
        );

      if (envConfig['STACK'] !== 'BE') throw new Error(`STACK must be 'BE'`);

      for (const [key, value] of Object.entries(envConfig)) {
        this.cachedValues[key] = value;
      }

      for (const secretName of EnvironmentVariablesManager.secrets) {
        await this.retrieveSecret(secretName, secretName !== 'GOOGLE_API_KEY_FILE');
      }
      for (const parameterName of EnvironmentVariablesManager.parameters.filter(
        (p) => !requiredEnvVariables.includes(p),
      )) {
        await this.retrieveParameter(parameterName);
      }

      // If the STACK is BE, disable all CRONs, since this is the User Serving Stack, and for the moment disable all CRONs in production
      if (envConfig['STACK'] === 'BE') {
        Object.entries(this.cachedValues).forEach(([key, value]) => {
          if (key.includes('CRON') && !key.includes('ENVIRONMENT')) this.cachedValues[key] = 'true';
        });
      }
    }
    EnvironmentVariablesManager.initialized = true;
  }

  // Get an env variable from the cache
  getEnvVariable(envVariableName) {
    if (!EnvironmentVariablesManager.initialized) {
      return process.env[envVariableName];
    }
    return this.cachedValues[envVariableName] ? this.cachedValues[envVariableName] : null;
  }
}

// Export as a singleton
const instance = new EnvironmentVariablesManager();
Object.freeze(instance);

module.exports = instance;
