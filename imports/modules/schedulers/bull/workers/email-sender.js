import sg from '@sendgrid/mail';
import nodemailer from 'nodemailer';

import { Email } from '../../../../collections/emails';
import Config from '../../../config/server';

const debug = require('debug')('scheduler:bull:emails');

sg.setApiKey(Config.sendgridAPIKey);

let transporter = undefined;

module.exports = function(bullSystem) {
  async function sendViaSendgrid(emailOptions) {
    const res = await sg.send(emailOptions);
    ElasticLogger.log('Email sent', emailOptions);
    Email.insert(emailOptions);
    return true;
  }

  function sendViaSMTP(emailOptions) {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: RemoteConfig.smtpServer.host,
        port: RemoteConfig.smtpServer.port,
        secure: RemoteConfig.smtpServer.port === 465,
        auth: {
          user: RemoteConfig.smtpServer.auth.user,
          pass: RemoteConfig.smtpServer.auth.pass,
        },
      });
    }

    return new Promise(resolve => {
      transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        debug('Message sent ', info.messageId);
        debug('Preview URL ', nodemailer.getTestMessageUrl(info));
        ElasticLogger.log('Email sent', emailOptions);
        Email.insert(emailOptions);
        resolve(true);
      });
    });
  }

  const processFunction = Meteor.bindEnvironment(function(job) {
    return new Promise(async resolve => {
      const { data } = job;
      const { email } = data;

      if (RemoteConfig.smtpServer && RemoteConfig.smtpServer.host) {
        await sendViaSMTP(email);
      } else {
        await sendViaSendgrid(email);
      }

      return true;
    });
  });

  bullSystem.bullJobs.process('send-email', processFunction);
};
