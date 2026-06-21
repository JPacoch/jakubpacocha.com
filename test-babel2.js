const fs = require('fs');
const { execSync } = require('child_process');

execSync('curl -sL https://unpkg.com/@babel/standalone/babel.min.js -o babel-local.js');
const babelCode = fs.readFileSync('babel-local.js', 'utf8');
eval(babelCode);

try {
  const code1 = `
    const App = () => <div>Hello</div>;
  `;
  const out1 = Babel.transform(code1, { 
    presets: [
      ['react', { runtime: 'classic' }],
      'env'
    ]
  }).code;
  console.log("With preset config:");
  console.log(out1);
} catch(e) {
  console.log("Error 1:", e.message);
}

try {
  const code2 = `
    /** @jsx React.createElement */
    const App = () => <div>Hello</div>;
  `;
  const out2 = Babel.transform(code2, { presets: ['react', 'env'] }).code;
  console.log("\nWith pragma @jsx:");
  console.log(out2);
} catch(e) {
  console.log("Error 2:", e.message);
}
