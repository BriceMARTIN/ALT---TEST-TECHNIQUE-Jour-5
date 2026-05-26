const legacyFunc = require('../legacy/orderReportLegacy');
const newFunc = require('../src/index');

test('Golden Master Test', () => {
  expect(newFunc.run()).toEqual(legacyFunc.run());
}, 15000);

test('Output file comparison', () => {
  const fs = require('fs');
  const path = require('path');
  const legacyOutput = fs.readFileSync(path.join(__dirname, '../legacy/output.json'), 'utf-8');
  const newOutput = fs.readFileSync(path.join(__dirname, '../src/output.json'), 'utf-8');
  expect(newOutput).toEqual(legacyOutput);
});
