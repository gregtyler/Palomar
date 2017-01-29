/* eslint-disable */
const CACHE_NAME = 'gregtyler-cache';
const urlsToCache = [
  '/',
  '/offline'
];
/*
self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();
        fetchRequest.mode = 'no-cors';

        // Don't try and handle about:blank pages
        if (fetchRequest.url === 'about:blank') {
          return new Response('',  {headers: {'Content-Type': 'text/html'}});
        }

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function() {
          // Offline
          if (fetchRequest.headers.get('Accept').indexOf('text/html') !== -1) {
            // If the request is for a page, show an offline message
            return caches.match('/offline');
          } else if (fetchRequest.headers.get('Accept').indexOf('image') !== -1) {
            return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', {headers: {'Content-Type': 'image/svg+xml'}});
          }
        });
      })
    );
});
*/
