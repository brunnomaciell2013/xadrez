/* Service worker: guarda o aplicativo e o Stockfish 18 no aparelho para funcionar offline. */
var CACHE = 'xadrez-6.1-2410e0f8b2';
var PRECACHE = ["./", "index.html", "manifest.webmanifest", "engine/stockfish-18-lite-single.js", "engine/stockfish-18-lite-single.wasm.part1", "engine/stockfish-18-lite-single.wasm.part2", "engine/stockfish-18-lite-single.wasm.part3", "engine/COPYING.txt", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/maskable-512.png"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('xadrez-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // página: tenta a rede (para receber versões novas) e cai no cache se estiver offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', cp); }); return r;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  // demais arquivos (motor, ícones): cache primeiro; o que não estiver guardado é buscado e guardado
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (r) {
      if (r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
      return r;
    });
  }));
});
