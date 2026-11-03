// 에테르 크로니클 오프라인 실행용 서비스 워커
// 한 번 열어 둔 게임 파일과 글꼴을 저장해 두었다가, 인터넷이 없어도 실행되게 한다.
// 게임을 새로 올리면 아래 버전 숫자를 바꿔 주세요.
const CACHE = 'aether-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  // 게임 파일은 먼저 인터넷에서 새것을 받고, 안 되면 저장본을 쓴다
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html') || caches.match('./'))));
    return;
  }
  // 글꼴 · 아이콘은 저장본 먼저
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })));
});
