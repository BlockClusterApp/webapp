'use strict';

/* eslint-disable global-require */

const fs = require('fs');
const path = require('path');

module.exports = () => {
  console.log("Requiring APIs");
  const apiFolder = path.join( process.cwd().split(".meteor")[0], 'imports', 'api');
  console.log("APIFolder", apiFolder);
  fs.readdirSync(apiFolder).forEach(fileName => {
    const stat = fs.lstatSync(path.join(apiFolder, fileName));
    if (stat.isFile() && fileName !== 'index.js') {
      console.log("Requiring", path.join(apiFolder, fileName.replace('.js', '')))
      require(path.join(apiFolder, fileName.replace('.js', ''))) // eslint-disable-line global-require
    }
  });
};