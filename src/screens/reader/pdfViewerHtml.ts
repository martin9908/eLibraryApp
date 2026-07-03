import { colors } from '@elibrary/theme';

/** pdf.js version served from cdnjs (UMD build exposing the `pdfjsLib` global). */
const PDFJS_VERSION = '3.11.174';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

/**
 * Builds a self-contained HTML document that renders `url` with pdf.js inside a
 * WebView. Pages render to canvases in a continuous scroll; pinch-to-zoom is
 * enabled via the viewport. Progress/errors are posted back to React Native
 * through `window.ReactNativeWebView.postMessage`.
 *
 * Keep the WebView `source.baseUrl` set to the PDF's origin so pdf.js fetches
 * the file same-origin (avoids cross-origin/CORS issues with Firebase URLs).
 */
export function buildPdfViewerHtml(url: string): string {
    const safeUrl = JSON.stringify(url);
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: ${colors.ink}; }
  #pages { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px 8px 40px; }
  canvas { width: 100%; max-width: 900px; height: auto; background: #fff; border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
  #status { color: #fff; font-family: -apple-system, Roboto, sans-serif; text-align: center; padding: 56px 24px; font-size: 15px; line-height: 1.5; }
  #status .sub { opacity: 0.7; font-size: 13px; margin-top: 6px; }
</style>
</head>
<body>
  <div id="status">Loading eBook…</div>
  <div id="pages"></div>
  <script src="${PDFJS_BASE}/pdf.min.js"></script>
  <script>
    (function () {
      function post(o) {
        try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch (e) {}
      }
      if (!window.pdfjsLib) {
        document.getElementById('status').innerHTML = 'Reader failed to load.<div class="sub">Check your connection and try again.</div>';
        post({ type: 'error', message: 'pdf.js failed to load' });
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_BASE}/pdf.worker.min.js';
      var status = document.getElementById('status');
      var pages = document.getElementById('pages');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var scale = 1.5 * dpr;

      pdfjsLib.getDocument({ url: ${safeUrl} }).promise.then(function (pdf) {
        status.style.display = 'none';
        post({ type: 'loaded', pages: pdf.numPages });
        var chain = Promise.resolve();
        for (var n = 1; n <= pdf.numPages; n++) {
          (function (pageNum) {
            chain = chain.then(function () {
              return pdf.getPage(pageNum).then(function (page) {
                var viewport = page.getViewport({ scale: scale });
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                pages.appendChild(canvas);
                return page.render({ canvasContext: ctx, viewport: viewport }).promise;
              });
            });
          })(n);
        }
        return chain;
      }).catch(function (err) {
        status.style.display = 'block';
        status.innerHTML = 'Unable to open this eBook.<div class="sub">' + (err && err.message ? err.message : '') + '</div>';
        post({ type: 'error', message: String(err && err.message ? err.message : err) });
      });
    })();
  </script>
</body>
</html>`;
}

/** Origin of a URL, used as the WebView baseUrl for same-origin PDF fetches. */
export function originOf(url: string): string {
    const m = /^(https?:\/\/[^/]+)/i.exec(url);
    return m ? m[1] : 'https://firebasestorage.googleapis.com';
}
