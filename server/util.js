const fs = require('fs');
const { promisify } = require('util');
const csvStringify = promisify(require('csv-stringify'));

const writeFileAsync = promisify(fs.writeFile);

const writeCsv = async (filePath, data) => {
  const formatted = [Object.keys(data[0])];
  data.forEach((entry) => formatted.push(Object.values(entry)));

  const csv = await csvStringify(formatted);

  return writeFileAsync(filePath, csv);
};

module.exports = { writeCsv };
