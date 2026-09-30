// O trabalho real do pdf.js (incluindo as chamadas a Uint8Array.toHex/etc.)
// acontece dentro desta worker, num "realm" JS separado da pagina principal
// -- por isso o polyfill aplicado la' (pdfjs-loader.mjs) nao chega aqui, tem
// de ser aplicado tambem dentro da propria worker. O import dinamico (em vez
// de "import" estatico) garante que o polyfill corre mesmo antes do pdf.js
// original ser avaliado, porque imports estaticos sao sempre avaliados antes
// de qualquer outro codigo do modulo, independentemente da ordem em que
// estao escritos.
await import("/pdfjs-polyfill.mjs");
await import("/pdf.worker.min.mjs");
