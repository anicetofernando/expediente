// Polyfill dos metodos Uint8Array.toHex/fromHex/toBase64/fromBase64 (proposta
// TC39 "Uint8Array to/from base64/hex"), que o pdf.js recente ja usa
// internamente mas que ainda nao existem em todos os browsers moveis reais --
// mesmo Chrome/Edge Android "actualizados" podem estar numa versao anterior a
// esta funcionalidade chegar ao motor, mesmo quando o Chrome do computador
// (normalmente mais recente) ja a suporta. Sem isto, o pdf.js falha com
// "toHex is not a function" (ou fromHex/toBase64/fromBase64) ao processar
// o PDF, tanto na thread principal como dentro do worker.
const HEX_CHARS = "0123456789abcdef";

if (typeof Uint8Array.prototype.toHex !== "function") {
  Uint8Array.prototype.toHex = function toHex() {
    let out = "";
    for (let i = 0; i < this.length; i++) {
      out += HEX_CHARS[this[i] >> 4] + HEX_CHARS[this[i] & 15];
    }
    return out;
  };
}

if (typeof Uint8Array.fromHex !== "function") {
  Uint8Array.fromHex = function fromHex(hex) {
    const out = new Uint8Array(hex.length >> 1);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
  };
}

if (typeof Uint8Array.prototype.toBase64 !== "function") {
  Uint8Array.prototype.toBase64 = function toBase64() {
    let binary = "";
    for (let i = 0; i < this.length; i++) binary += String.fromCharCode(this[i]);
    return btoa(binary);
  };
}

if (typeof Uint8Array.fromBase64 !== "function") {
  Uint8Array.fromBase64 = function fromBase64(base64) {
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  };
}
