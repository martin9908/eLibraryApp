// Stub for pdfjs-dist's optional Node-only `canvas` dependency. The browser
// renders PDFs with the built-in <canvas>, so this native module is never used
// on the client — aliasing it here keeps webpack/Turbopack from trying to
// resolve it. See next.config.ts.
module.exports = {};
