# air-challenge

## Installation

To install:

1. `npm install`
2. Create a file `secret.js` in the `server` folder which exports an object with the property `FLICKR_KEY`, containing your Flickr API key.

To run in development mode:

- `npm run dev`

To run in production mode:

- `npm start`

## Testing

1. To import asset metadata from a Flickr collection, make an HTTP POST requst to http://localhost:3000/collection/importer. The request body should contain a property `url` containing the url of the collection.
