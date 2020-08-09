const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const download = require('image-downloader');
const csvStringify = promisify(require('csv-stringify'));

const writeFileAsync = promisify(fs.writeFile);
const renameAsync = promisify(fs.rename);

/**
 * Converts an array of objects ```data``` with the same schema to a CSV format and writes it to a file at ```filePath```. Headers are determined by the keys on the first object.
 * @param {Array<object>} data
 * @param {string} filePath
 */
const writeCsv = async (data, filePath) => {
  const formatted = [Object.keys(data[0])];
  data.forEach((entry) => formatted.push(Object.values(entry)));

  const csv = await csvStringify(formatted);

  return writeFileAsync(filePath, csv);
};

/**
 * Rudimenatary batch downloader (should probably be replaced with something more robust).
 * @param {Array<object>} sources An array of objects with keys ```url``` and ```name``` - the url of the image to download the name of the file to save it in
 * @param {string} directory
 * @param {number} batchSize The number of images to download concurrently.
 * @returns The number of images successfully downloaded.
 */
const downloadImages = async (sources, directory, batchSize) => {
  let index = 0;
  let success = 0;

  while (index < sources.length) {
    // eslint-disable-next-line no-loop-func
    const batch = sources.slice(index, index + batchSize).map(({ url, name }) => {
      return download
        .image({
          url,
          dest: directory,
        })
        .then(({ filename }) => {
          const ext = path.extname(filename);
          renameAsync(filename, `${directory}/${name}${ext}`);
          console.log(filename);
          success += 1;
        });
    });
    index += batchSize;

    // eslint-disable-next-line no-await-in-loop
    await Promise.all(batch);
  }

  return success;
};

module.exports = { writeCsv, downloadImages };
