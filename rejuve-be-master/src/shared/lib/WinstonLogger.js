// Third party imports
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const path = require('path');

// Local application imports
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class CustomLogger {
  constructor(options) {
    const { destination, level, logGroupName } = options;

    let logTransports = [];

    if (destination === 'cloudwatch') {
      const today = new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
      const logStreamName = `${today}-${options.logStreamName}`; // Append the date to the log stream name  (e.g. '2020-01-01-logs')
      logTransports.push(
        new WinstonCloudWatch({
          awsRegion: 'us-east-1',
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          jsonMessage: false,
          createLogGroup: true,
          createLogStream: true,
        }),
      );
    } else {
      logTransports = new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.colorize(),
          format.printf(({ level, message, timestamp }) => `${timestamp} - ${level}: ${message}`),
        ),
      });
    }

    this.logger = createLogger({
      level: level || 'info',
      format:
        destination === 'cloudwatch'
          ? format.json()
          : format.combine(
              format.timestamp(),
              format.printf((info) => {
                let formattedPattern = '[{timestamp}][{filename}][{method}]:[{level}] - {message}';
                return formattedPattern
                  .replace('{timestamp}', (info.timestamp || '').padEnd(25, ' ')) // Assuming 25 characters for timestamp
                  .replace('{filename}', (info.filename || '').padEnd(30, ' ')) // 30 characters for filename
                  .replace('{method}', (info.method || '').padEnd(40, ' ')) // Assuming 20 characters for method
                  .replace('{level}', info.level) // Assuming 10 characters for level
                  .replace('{message}', info.message || '');
              }),
            ),

      transports: logTransports,
    });
  }

  log(level, message) {
    this.logger.log(level, message, ...this.getCallerInfo());
  }

  info(message) {
    this.logger.info(message, ...this.getCallerInfo());
  }

  warn(message) {
    this.logger.warn(message, ...this.getCallerInfo());
  }

  error(message) {
    this.logger.error(message, ...this.getCallerInfo());
  }

  debug(message) {
    this.logger.debug(message, ...this.getCallerInfo());
  }

  getCallerInfo() {
    const stackList = new Error().stack.split('\n').slice(3);
    const stackRegexp = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    const stackRegexp2 = /at\s+()(.*):(\d*):(\d*)/gi;

    const s = stackList[0] || stackList[1];
    const sp = stackRegexp.exec(s) || stackRegexp2.exec(s);

    if (!sp) {
      return [];
    }

    let methodName = sp[1];
    const fileName = path.basename(sp[2]);

    if (methodName === 'Object.<anonymous>') {
      methodName = 'global';
    }

    return [
      {
        filename: fileName,
        method: methodName,
      },
    ];
  }
}

const streamDestination =
  EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT') === 'production' ||
  EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT') === 'staging'
    ? 'cloudwatch'
    : 'console';

const loggingEnv = EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT');

// Requests Logger
const RequestsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/rejuve-be-' + loggingEnv,
  logStreamName: 'requests',
});

// User Logger
const UserLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/rejuve-be-' + loggingEnv,
  logStreamName: 'user',
});


// Server Logger
const ServerLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/rejuve-be-' + loggingEnv,
  logStreamName: 'server',
});

// Client Logger
const ClientLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/rejuve-be-' + loggingEnv,
  logStreamName: 'client',
});


module.exports = {
  ClientLogger,
  ServerLogger,
  RequestsLogger,
  UserLogger
};
