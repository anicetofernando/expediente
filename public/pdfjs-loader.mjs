import * as pdfjs from "/pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
window.__cfmPdfJs = pdfjs;
