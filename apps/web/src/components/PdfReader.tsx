'use client';

import { resolveEbookSource } from '@/src/lib/ebookSource';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Load the pdf.js worker from a CDN matching the bundled pdfjs version.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const STEP = 0.25;

type Props = {
    url: string;
    title: string;
    onClose: () => void;
    /** Reports reading position so it can be persisted (Continue Reading). */
    onProgress?: (page: number, totalPages: number) => void;
};

export function PdfReader({ url, title, onClose, onProgress }: Props) {
    const source = useMemo(() => resolveEbookSource(url), [url]);
    const isDrive = source.kind === 'drive';

    const [numPages, setNumPages] = useState(0);
    const [page, setPage] = useState(1);
    const [scale, setScale] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const pageWrapRef = useRef<HTMLDivElement>(null);

    // Report progress once the doc is loaded and whenever the page changes.
    // (Drive-embedded PDFs don't expose page count, so only fire when known.)
    useEffect(() => {
        if (loaded && numPages > 0) onProgress?.(page, numPages);
    }, [page, numPages, loaded, onProgress]);

    // Lock body scroll while the reader is open, and wire keyboard shortcuts.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (isDrive) return;
            if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, numPages || p));
            if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 1));
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose, numPages, isDrive]);

    useEffect(() => {
        pageWrapRef.current?.scrollTo({ top: 0 });
    }, [page]);

    const zoomOut = useCallback(() => setScale((s) => Math.max(MIN_SCALE, +(s - STEP).toFixed(2))), []);
    const zoomIn = useCallback(() => setScale((s) => Math.min(MAX_SCALE, +(s + STEP).toFixed(2))), []);

    const toggleFullscreen = useCallback(() => {
        const el = document.getElementById('pdf-reader-root');
        if (!document.fullscreenElement) el?.requestFullscreen?.();
        else document.exitFullscreen?.();
    }, []);

    return (
        <div id="pdf-reader-root" className="reader-overlay" role="dialog" aria-label={`Reading ${title}`}>
            <div className="reader-toolbar">
                <div className="reader-title" title={title}>📖 {title}</div>

                <div className="reader-controls">
                    {!isDrive && (
                        <>
                            <button className="reader-btn" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1} aria-label="Previous page">◀</button>
                            <span className="reader-pageinfo">{loaded ? `${page} / ${numPages}` : '—'}</span>
                            <button className="reader-btn" onClick={() => setPage((p) => Math.min(p + 1, numPages || p))} disabled={!loaded || page >= numPages} aria-label="Next page">▶</button>

                            <span className="reader-sep" />

                            <button className="reader-btn" onClick={zoomOut} disabled={scale <= MIN_SCALE} aria-label="Zoom out">−</button>
                            <span className="reader-zoom">{Math.round(scale * 100)}%</span>
                            <button className="reader-btn" onClick={zoomIn} disabled={scale >= MAX_SCALE} aria-label="Zoom in">+</button>

                            <span className="reader-sep" />
                        </>
                    )}
                    <button className="reader-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">⛶</button>
                </div>

                <button className="reader-close" onClick={onClose} aria-label="Close reader">✕</button>
            </div>

            <div className="reader-canvas" ref={pageWrapRef}>
                {isDrive ? (
                    <iframe
                        src={source.embedUrl}
                        title={title}
                        className="reader-iframe"
                        allow="autoplay"
                        allowFullScreen
                    />
                ) : error ? (
                    <div className="reader-message">
                        <span className="empty-emoji">📄</span>
                        <div className="empty-title">Couldn’t open this eBook</div>
                        <p>{error}</p>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-white" style={{ marginTop: 16 }}>
                            Open in browser instead
                        </a>
                    </div>
                ) : (
                    <Document
                        file={source.url}
                        onLoadSuccess={({ numPages: n }) => { setNumPages(n); setLoaded(true); }}
                        onLoadError={(e) => setError(e?.message ?? 'The file could not be loaded.')}
                        loading={<div className="reader-message"><div className="spinner" /><p style={{ marginTop: 14 }}>Loading eBook…</p></div>}
                        error={<div className="reader-message">Failed to load PDF.</div>}>
                        <Page
                            pageNumber={page}
                            scale={scale}
                            renderTextLayer
                            renderAnnotationLayer
                            className="reader-page"
                        />
                    </Document>
                )}
            </div>
        </div>
    );
}
