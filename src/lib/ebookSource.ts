/**
 * Classifies a stored `ebookUrl` so the reader can pick the right strategy.
 *
 * - Direct PDF URLs (Firebase Storage, any `.pdf`) → rendered by pdf.js in the
 *   WebView.
 * - Google Drive / Docs share links → loaded via Drive's own `/preview` viewer.
 *   Drive doesn't send CORS headers, so pdf.js can't fetch the bytes; pointing
 *   the WebView at the preview page sidesteps that (file must be shared
 *   "anyone with the link").
 */
export type EbookSource =
    | { kind: 'pdf'; url: string }
    | { kind: 'drive'; embedUrl: string; fileUrl: string };

/** Extracts a Google Drive/Docs file id from common share-link shapes. */
export function driveFileId(url: string): string | null {
    if (!/(?:drive|docs)\.google\.com/i.test(url)) return null;
    const m = url.match(/\/d\/([\w-]+)/) ?? url.match(/[?&]id=([\w-]+)/);
    return m ? m[1] : null;
}

export function resolveEbookSource(url: string): EbookSource {
    const id = driveFileId(url);
    if (id) {
        return { kind: 'drive', embedUrl: `https://drive.google.com/file/d/${id}/preview`, fileUrl: url };
    }
    return { kind: 'pdf', url };
}
