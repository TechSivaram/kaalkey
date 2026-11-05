const fs = require("node:fs");
const path = require("node:path");

const htmlPath = path.join(process.cwd(), "dist-desktop", "index.html");

if (!fs.existsSync(htmlPath)) {
  console.error(`Expo web export entry was not found: ${htmlPath}`);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, "utf8");

const csp =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; " +
  "font-src 'self' data:; " +
  "connect-src 'self' blob:; " +
  "media-src 'self' blob:; " +
  "worker-src 'self' blob:; " +
  "frame-src 'none'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

const metaTag = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;

html = html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>\s*/gi, "");

if (!/<head(?:\s[^>]*)?>/i.test(html)) {
  console.error("Expo export HTML does not contain a <head> element.");
  process.exit(1);
}

html = html.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}\n    ${metaTag}`);

fs.writeFileSync(htmlPath, html, "utf8");
console.log("Applied the production desktop Content Security Policy.");
