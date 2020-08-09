const path = require('path');
const express = require('express');

const PORT = 3000;

const app = express();

// standard parsers
app.use(express.json(), express.urlencoded({ extended: true }));

app.get('/one', (req, res) => {
  res.send('one');
});
app.get('/two', (req, res) => {
  res.send('two');
});

// catch-all error handlers
app.use((req, res) => res.status(404).send('Not Found'));
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(err);
  }

  res.status(err.status || 500).send(err.message);
});

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));

module.exports = app;
