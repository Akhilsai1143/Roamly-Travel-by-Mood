const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '../src/data/destinations.js'), 'utf8');
const regex = /id:\s*"([^"]+)",\s*name:\s*"([^"]+)"[\s\S]*?image:\s*"([^"]+)"/g;

let match;
const primaryList = [];
while ((match = regex.exec(code)) !== null) {
  primaryList.push({ id: match[1], name: match[2], image: match[3] });
}

console.log("Total primary destinations found:", primaryList.length);
primaryList.forEach((item, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${item.name.padEnd(20)} [${item.id.padEnd(14)}] ${item.image}`);
});
