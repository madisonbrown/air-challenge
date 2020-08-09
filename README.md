# air-challenge

## Installation

To install:

1. `npm install`
2. Create a file `secret.js` in the `server` folder which exports an object with the property `FLICKR_KEY`, containing your Flickr API key.

To run in development mode:

- `npm run dev`

To run in production mode:

- `npm start`

## Use

- After starting the server, to import asset metadata from a Flickr collection, make an HTTP POST requst to http://localhost:3000/collection/importer. The request body should contain a property `url` containing the url of the collection.

- To download all images from an album, make an HTTP POST requst to http://localhost:3000/album/importer. The request body should contain a property `url` containing the url of the album.

## Notes

- Endpoints use the POST method with the assumption that there would be an accompanying GET request to retrieve the downloaded data. Semantically, both endpoints can be thought of as creating an instance of a service.
- For this reason, and because of the requirement to return the number of _successfully_ imported resources, the endpoints currently block until all data is imported and stored. For large image sets, this may be unacceptable. It may be preferable to immediately return an ID representing the service instance, which can then be used to make further requests for its status. Some streaming protocol could be used to alert the client when the service is complete and the data is available.
- The URL of the orginal resolution images does not seem to be available ([possibly only to free accounts](https://www.flickr.com/groups/51035612836@N01/discuss/72157623814730992/)). The highest resolution I was able to retrieve was medium resolution. Documentation is a bit lacking here.
