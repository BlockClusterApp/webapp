Package.describe({
  name: 'blockcluster:pages',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.6.0.1');
  api.use('ecmascript');
  api.mainModule('pages.js');
  api.addFiles([
    'css/pages.css',
    'css/pages-icons.css',
    'css/light.css',
    'js/pages.js'
  ], 'client');
  api.addAssets([
    'fonts/pages-icon/Pages-icon.eot',
    'fonts/pages-icon/Pages-icon.svg',
    'fonts/pages-icon/Pages-icon.ttf',
    'fonts/pages-icon/Pages-icon.woff'
  ], 'client')
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('blockcluster:pages');
  api.mainModule('pages-tests.js');
});
