const path = require('path');
const express = require('express');
const { writeCsv } = require('./util.js');
const flickrApi = require('./flickr.js');

const PORT = 3000;

const app = express();

// standard parsers
app.use(express.json(), express.urlencoded({ extended: true }));

app.post('/collection/importer', (req, res, next) => {
  const { url } = req.query;

  if (!url) {
    return next({
      status: 400,
      message: 'Missing query parameter "url".',
    });
  }

  return flickrApi.getCollectionAssets(url).then((data) => {
    const { collectionId, assets } = data;

    const filePath = path.resolve(__dirname, `../data/metadata/${collectionId}`);

    writeCsv(filePath, assets)
      .then(() => {
        res.status(201).json({
          import_count: assets.length,
        });
      })
      .catch((err) => {
        next(err);
      });
  });
});

app.get('/album/importer', (req, res) => {
  res.send('album');
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
