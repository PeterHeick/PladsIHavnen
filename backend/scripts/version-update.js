// scripts/version-update.js
const fs = require('fs');
const path = require('path');

const packagePath = path.resolve(__dirname, '../package.json');
const package = require(packagePath);

// Opdater patch version
const versionParts = package.version.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1;
package.version = versionParts.join('.');

// Skriv den opdaterede package.json
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));

console.log(`Version opdateret til ${package.version}`);