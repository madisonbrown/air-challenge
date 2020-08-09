/* eslint-disable camelcase */
const fs = require('fs');
const path = require('path');
const express = require('express');
const { writeCsv, downloadImages } = require('./util.js');
const flickrApi = require('./flickr.js');

const PORT = 3000;

// make sure the filesystem is set up properly
const METADATA_DIR = path.resolve(__dirname, '../data/metadata');
const MEDIA_DIR = path.resolve(__dirname, '../data/media');
fs.mkdirSync(METADATA_DIR, { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

const app = express();

// standard parsers
app.use(express.json(), express.urlencoded({ extended: true }));

/**
 * A route that exports metadata from Collections
 * - Input: Takes a Collection URL
 * - Output:
 *     - HTTP response of how many assets were imported
 *     - Writes all the asset metadata to a CSV file in a local directory named `metadata` with filename `[collection ID].csv`.
 *         - The CSV file should have the following header columns:
 *             - `id`: Flickr asset ID
 *             - `created`: Date the asset was created, i.e. when the photo was taken or video was recorded
 *             - `title`: The name the creator gave to the asset on Flickr (this might be blank for some assets)
 *             - `width`: Width for the largest version of the asset
 *             - `height`: Height for the largest version of the asset
 *             - `url`: URL for the highest-resolution version of the asset
 */
app.post('/collection/importer', async (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return next({
      status: 400,
      message: 'Missing query parameter "url".',
    });
  }

  // get all assets associated with the collection url
  const { collectionId, assetData } = await flickrApi.getCollectionAssets(url);

  const filePath = `${METADATA_DIR}/${collectionId}.csv`;
  // format the data as expected by the client
  const assets = assetData.map((asset) => ({
    id: asset.id,
    created: asset.datetaken,
    title: asset.title,
    width: asset.width_m,
    height: asset.height_m,
    url: asset.url_m,
  }));

  // convert the asset metadata to csv format and write to the filesystem
  await writeCsv(assets, filePath);

  // once the data is saved successfully, return the number of assets imported
  return res.status(201).json({
    import_count: assets.length,
  });
});

/**
 * A route that batch downloads assets from Albums
 * - Input: Takes an Album URL
 * - Output:
 *     - HTTP response of how many assets were downloaded
 *     - Downloads the highest-resolution version of each asset to a local directory named `media`. Each filename should be formatted as `[Flickr asset ID].[ext]`
 */
app.post('/album/importer', async (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return next({
      status: 400,
      message: 'Missing query parameter "url".',
    });
  }

  // get all assets associated with the album url
  const assetData = await flickrApi.getAlbumAssets(url);
  // prepare the data to be handled by the batch processor
  const imageUrls = assetData.map((asset) => ({ url: asset.url_m, name: asset.id }));
  // attempt to download all the images and the get number of successful imports
  const import_count = await downloadImages(imageUrls, MEDIA_DIR, 30);

  return res.status(201).json({ import_count });
});

// catch-all error handlers
app.use((req, res) => res.status(404).send('Not Found'));
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(err);
  }

  res.status(err.status || 500).send(err.message || 'Internal Server Error');
});

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));

module.exports = app;
