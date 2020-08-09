/* eslint-disable camelcase */

const querystring = require('querystring');
const fetch = require('node-fetch');

const { FLICKR_KEY } = require('./secret.js');

/**
 * Makes a GET request to the Flickr API, requesting a JSON response. Returns a promise resolving to the result of the request.
 * @param {string} method The API method string (e.g 'flickr.urls.lookupUser').
 * @param {object} args An object containing the query parameters to be sent with the request.
 */
const flickrApi = async (method, args) => {
  const host = 'https://www.flickr.com/services/rest/';
  const query = querystring.encode({
    method,
    api_key: FLICKR_KEY,
    format: 'json',
    nojsoncallback: 1,
    ...args,
  });

  return fetch(`${host}?${query}`);
};

/**
 * Given a Flickr collection url, returns a promise resolving to the id of the user that created it.
 * @param {string} collectionUrl A Flickr collection url.
 */
const getUserId = async (collectionUrl) => {
  return flickrApi('flickr.urls.lookupUser', { url: collectionUrl })
    .then((res) => res.json())
    .then((data) => data.user.id);
};

/**
 * Given an album url or id, returns a promise resolving to an array containing metadata about each asset contained in the album.
 * @param {string} album An album URL or id. If an id is provided, the ```userID``` of the album creator must also be provided.
 * @param {?string} userId The id of the user who created the album. Can be null if the album is specified by URL.
 */
const getAlbumAssets = async (album, userId = null) => {
  let user_id;
  let photoset_id;

  if (userId) {
    user_id = userId;
    photoset_id = album;
  } else {
    const idMatch = album.match(/.*\/albums\/([^/]*)/);

    if (!idMatch) {
      throw new Error('Invalid Collection URL.');
    }

    photoset_id = idMatch[1];
    user_id = await getUserId(album);
  }

  return flickrApi('flickr.photosets.getPhotos', {
    user_id,
    photoset_id,
    extras: 'date_taken,url_m,o_dims',
  })
    .then((res) => res.json())
    .then((data) => data.photoset.photo);
};

/**
 * Given a Flickr collection url, returns a promise resolving to an array containing metadata for all assets within all albums in the collection.
 * @param {string} collectionUrl A Flickr collection url.
 */
const getCollectionAssets = async (collectionUrl) => {
  // check for a collection id in the input URL
  const idMatch = collectionUrl.match(/.*\/collections\/([^/]*)/);

  if (!idMatch) {
    throw new Error('Invalid Collection URL.');
  }

  const collection_id = idMatch[1];
  const user_id = await getUserId(collectionUrl);

  // get metadata about all albums contained within the collection
  const albums = await flickrApi('flickr.collections.getTree', {
    collection_id,
    user_id,
  })
    .then((res) => res.json())
    .then((data) => data.collections.collection[0].set); // fix: needs more error checking

  // for each album, use its id to get metadata for all contained assets
  const assetSets = await Promise.all(albums.map((set) => getAlbumAssets(set.id, user_id)));

  return {
    collectionId: collection_id,
    assetData: assetSets.reduce((result, set) => {
      result.push(...set);
      return result;
    }, []),
  };
};

module.exports = {
  getCollectionAssets,
  getAlbumAssets,
};
