const fs = require('fs');
const path = require('path');

// Create the directory if it doesn't exist
const dir = path.join(process.cwd(), '.next', 'server', 'app', '(dashboard)');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Create the client-reference-manifest.js file
const filePath = path.join(dir, 'page_client-reference-manifest.js');
const content = `
// This is a dummy file to prevent the ENOENT error during build
module.exports = {
  ssrModuleMapping: {},
  edgeSSRModuleMapping: {},
  clientModules: {},
  entryCSSFiles: {}
};
`;

fs.writeFileSync(filePath, content);
console.log(`Created ${filePath}`);
