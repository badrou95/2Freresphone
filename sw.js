const CACHE = '2freres-v1';
const ASSETS = [
  '/', '/index.html', '/articles.html',
  '/style.css', '/app.js', '/articles.js',
  '/manifest.json',
  '/images/icon-192.png', '/images/icon-512.png', '/images/logo.png',
  '/data/phones-1.json','/data/phones-2.json','/data/phones-3.json',
  '/data/phones-4.json','/data/phones-5.json','/data/phones-6.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
      // cache-first falling back to network; optional dynamic cache
      return res;
    }))
  );
});
