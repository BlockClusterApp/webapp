Package.describe({
  summary: 'Integrate with Raven JS for JavaScript errors and logs',
  version: '0.3.0',
  name: 'blockcluster:raven',
  git: 'https://github.com/deepwell/meteor-raven.git'
});

Npm.depends({
  'raven': '2.6.4'
});

Package.onUse(function (api, where) {
  api.versionsFrom('METEOR@0.9.0');
  api.addFiles('lib/main.js', [ 'client', 'server' ]);
  api.addFiles('vendor/raven.js', 'client');

  api.export([
    'RavenLogger'
  ], [
    'client',
    'server'
  ]);
});
