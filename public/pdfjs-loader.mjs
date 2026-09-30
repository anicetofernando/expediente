import "/pdfjs-polyfill.mjs";
import * as pdfjs from "/pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker-wrapper.mjs";
window.__cfmPdfJs = pdfjs;
