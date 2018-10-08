const winston = Npm.require('winston');

let logger = console.log;
let _tags = {}

function fetchFormat(message, tags) {
  if (typeof tags === 'object') {
    return {
      message,
      ...tags,
      timestamp: new Date(),
      ..._tags
    };
  } else {
    return {
      message,
      tags,
      timestamp: new Date(),
      ..._tags
    };
  }
}

function initialize(settings, opts) {
  const finalOpts = {};
  if (Meteor.isServer) {
    finalOpts.level = 'info';
    finalOpts.format = winston.format.json();
    finalOpts.transports = [new winston.transports.Console()];
    settings.logFiles = settings.logFiles || [];
    settings.logFiles.forEach(logFile => {
      const loggerOpts = {
        filename: logFile.filename,
      };
      if (logFile.level) {
        loggerOpts.level = logFile.level;
      } else {
        loggerOpts.level = 'info';
      }
      finalOpts.transports.push(new winston.transports.File(loggerOpts));
    });
    if(opts && opts.tags) {
      _tags = {..._tags, ...opts.tags}
    }
    logger = winston.createLogger(finalOpts);
  } else {
    logger = console.log;
  }
}

function log(message, tags) {
  logger.info(fetchFormat(message, tags));
}

function info(message, tags) {
  if (Meteor.isServer) {
    logger.info(fetchFormat(message, tags));
  } else {
    logger.info(message, tags);
  }
}

function error(message, tags) {
  if (Meteor.isServer) {
    logger.error(fetchFormat(message, tags));
  } else {
    logger.error(message, tags);
  }
}

function warn(message, tags) {
  if (Meteor.isServer) {
    logger.warn(fetchFormat(message, tags));
  } else {
    logger.warn(message, tags);
  }
}

ElasticLogger = {
  initialize: initialize,
  log,
  info,
  warn,
  error,
};
