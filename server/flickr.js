/* eslint-disable camelcase */

const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const fetch = require('node-fetch');

const { FLICKR_KEY } = require('./secret.js');

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

const getUserId = async (url) => {
  return flickrApi('flickr.urls.lookupUser', { url })
    .then((res) => res.json())
    .then((data) => data.user.id);
};

const getCollectionAssets = async (collectionUrl) => {
  const match = collectionUrl.match(/.*\/collections\/([^/]*)\/?/);
  if (!match) {
    throw new Error('Invalid Collection URL.');
  }

  const collection_id = match[1];
  const user_id = await getUserId(collectionUrl);

  const albums = await flickrApi('flickr.collections.getTree', { collection_id, user_id })
    .then((res) => res.json())
    .then((data) => data.collections.collection[0].set);

  const assetSets = await Promise.all(
    albums.map((set) => {
      return flickrApi('flickr.photosets.getPhotos', {
        user_id,
        photoset_id: set.id,
        extras: 'date_taken,url_m,o_dims',
      })
        .then((res) => res.json())
        .then((data) => data.photoset.photo);
    })
  );

  const assets = [];
  assetSets.forEach((set) =>
    set.forEach((asset) => {
      const { id, datetaken: created, title, width_m: width, height_m: height, url_m: url } = asset;
      assets.push({
        id,
        created,
        title,
        width,
        height,
        url,
      });
    })
  );

  return {
    collectionId: collection_id,
    assets,
  };
};

module.exports = {
  getCollectionAssets,
};
