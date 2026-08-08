// ============================================================
//  브랜드멤버스(고객앱) 서비스워커
//  ★ 배포할 때마다 CACHE_VERSION 숫자를 한 칸 올리세요 (v1 → v2 → ...)
//    안 올리면 사용자 폰에 옛 화면이 계속 남습니다.
// ============================================================
const CACHE_VERSION = "v43";
const CACHE_NAME = "brandmembers-" + CACHE_VERSION;

self.addEventListener("install", function(e){
  self.skipWaiting();   // 새 워커 즉시 대기 → 다음 기회에 자동 적용
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE_NAME) return caches.delete(k);   // 옛 캐시 삭제
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("message", function(e){
  if(e.data && e.data.type === "SKIP_WAITING"){ self.skipWaiting(); }
});

self.addEventListener("fetch", function(event){
  const req = event.request;
  if(req.method !== "GET") return;
  const isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") >= 0;

  if(isHTML){
    // HTML: 항상 네트워크 최신, 캐시에 저장하지 않음 (옛 화면이 뜨는 것 원천 차단)
    event.respondWith(
      fetch(req, { cache: "no-store" }).catch(function(){
        return caches.match(req) || caches.match("/index.html");   // 완전 오프라인 시에만
      })
    );
    return;
  }
  // 그 외(이미지·JS 등): 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(res){
        return res;
      });
    }).catch(function(){ return fetch(req); })
  );
});
