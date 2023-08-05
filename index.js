const express = require('express');
const { MOVIES } = require('@consumet/extensions');
const { META } = require('@consumet/extensions');
const axios = require('axios');
const cache = require('memory-cache'); // Require the memory-cache library

const app = express();
const port = 3000;
const use_cache = false; // Set to true to enable caching, false to disable

// Middleware function to check cache before making the actual API call
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.url;
    const cachedData = cache.get(key);
    if (cachedData) {
      res.json(cachedData); // Send the cached data as a response
    } else {
      // If data is not cached, proceed to the route handler
      res.sendResponse = res.json;
      res.json = (data) => {
        cache.put(key, data, duration * 1000); // Cache the response for the specified duration (in seconds)
        res.sendResponse(data);
      };
      next();
    }
  };
};

// Route to fetch episode sources with caching (if enabled)
if (use_cache) {

// Route to fetch episode sources with caching
app.get('/fetch-episode', cacheMiddleware(60), async (req, res) => {
  const episodeId = req.query.episodeId;
  const mediaId = req.query.mediaId;
  const server = req.query.server || 'upcloud';

  if (!episodeId || !mediaId) {
    res.status(400).json({ error: 'Missing episodeId or mediaId in query parameters' });
    return;
  }

  try {
    const flixhq = new MOVIES.FlixHQ();
    const data = await flixhq.fetchEpisodeSources(episodeId, mediaId, server);
    res.json(data);
  } catch (error) {
    console.error('Error fetching episode sources:', error);
    res.status(500).json({ error: 'Error fetching episode sources' });
  }
});

// Route to fetch TMDB info with caching
app.get('/tmdb-info', cacheMiddleware(3600), async (req, res) => {
  const mediaType = req.query.type;
  const mediaId = req.query.id;

  if (!mediaType || !mediaId) {
    res.status(400).json({ error: 'Missing type or mediaId in query parameters' });
    return;
  }

  try {
    const tmdb = new META.TMDB();
    const data = await tmdb.fetchMediaInfo(mediaId, mediaType);
    res.json(data);
  } catch (error) {
    console.error('Error fetching data info:', error);
    res.status(500).json({ error: 'Error fetching episode info' });
  }
}); } else {
  app.get('/fetch-episode', async (req, res) => {
    const episodeId = req.query.episodeId;
    const mediaId = req.query.mediaId;
    const server = req.query.server || 'upcloud'; // Use 'vidcloud' as default if server parameter is not provided
  
    if (!episodeId || !mediaId) {
      res.status(400).json({ error: 'Missing episodeId or mediaId in query parameters' });
      return;
    }
  
    try {
      const flixhq = new MOVIES.FlixHQ();
      const data = await flixhq.fetchEpisodeSources(episodeId, mediaId, server);
      res.json(data);
    } catch (error) {
      console.error('Error fetching episode sources:', error);
      res.status(500).json({ error: 'Error fetching episode sources' });
    }
  });
  
  app.get('/tmdb-info', async (req, res) => {
    const mediaType = req.query.type;
    const mediaId = req.query.id;
  
    if (!mediaType || !mediaId) {
      res.status(400).json({ error: 'Missing type or mediaId in query parameters' });
      return;
    }
  
    try {
      const tmdb = new META.TMDB();
      const data = await tmdb.fetchMediaInfo(mediaId, mediaType);
      res.json(data);
    } catch (error) {
      console.error('Error fetching data info:', error);
      res.status(500).json({ error: 'Error fetching episode info' });
    }
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
