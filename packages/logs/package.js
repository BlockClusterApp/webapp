Package.describe({
  summary: 'Log consumer',
  version: '0.1.0',
  name: 'blockcluster:logs',
});

Npm.depends({
  winston: '3.0.1',
  'winston-daily-rotate-file': '3.4.0',
});

Package.onUse(function(api, where) {
  api.versionsFrom('METEOR@0.9.0');
  api.addFiles('lib/main.js', ['server']);

  api.export(['ElasticLogger'], ['server']);
});
