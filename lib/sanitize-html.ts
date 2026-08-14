const BLOCKED_ELEMENTS = /<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)[^>]*>/gi;
const EVENT_ATTRIBUTES = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URLS = /\s+(href|src)\s*=\s*(["'])\s*(?:javascript|data:text\/html):[^"']*\2/gi;

export function sanitizeDocumentHtml(value: string) {
  return value
    .replace(BLOCKED_ELEMENTS, "")
    .replace(EVENT_ATTRIBUTES, "")
    .replace(DANGEROUS_URLS, " $1=\"#\"")
    .slice(0, 1_000_000);
}
