const CACHE = "mathora-v3";
const PRECACHE = ["/assets/Algebra-BTFX01nF.js","/assets/Algebra-C50dn4hq.js","/assets/Calculus-BYk-iybY.js","/assets/Solve-Detp3a1i.js","/assets/_commonjsHelpers-gnU0ypJ3.js","/assets/index-C9rsxeJT.js","/assets/index-CV7qKnmN.css","/assets/math-engine-B4UtQw2K.js","/assets/nerdamer.core-Cqpm7et3.js","/assets/nerdamer.core-DqCPl0bq.js","/icon-512.png","/icon.svg","/index.html","/manifest.webmanifest","/privacy-policy.html"];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c.addAll(["/", "/manifest.webmanifest", "/icon.svg", ...PRECACHE]),
      ),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  ),
);
self.addEventListener("fetch", (e) => {
  if (
    e.request.method !== "GET" ||
    new URL(e.request.url).origin !== self.location.origin
  )
    return;
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(e.request)) || caches.match("/")),
  );
});
