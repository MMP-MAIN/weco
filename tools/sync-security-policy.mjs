import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const htmlFiles = ['', 'admin', 'brand-discovery'].flatMap(dir =>
  readdirSync(join(root, dir)).filter(name => name.endsWith('.html')).map(name => join(root, dir, name))
).filter(file => /<head\b/i.test(readFileSync(file, 'utf8')));

export function securityPolicy(html, admin = false) {
  const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs, body]) => !/\bsrc\s*=/i.test(attrs) && body.trim())
    .map(([, , body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  const scripts = admin
    ? ['https://accounts.google.com', 'https://connect.facebook.net']
    : ['https://www.googletagmanager.com', 'https://connect.facebook.net', 'https://cdn.jsdelivr.net'];
  const connections = admin
    ? ['https://analyticsdata.googleapis.com', 'https://accounts.google.com', 'https://*.googleapis.com', 'https://graph.facebook.com', 'https://www.facebook.com', 'https://connect.facebook.net']
    : ['https://formsubmit.co', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com', 'https://www.google.com', 'https://*.doubleclick.net', 'https://*.facebook.com', 'https://connect.facebook.net', 'https://cdn.jsdelivr.net',
      // Exact existing Meta Pixel gateway origins observed in its public configuration.
      // Do not grant all run.app or on.aws tenants access.
      'https://mpc-pilot-3-s6uit34pua-ew.a.run.app',
      'https://kw-f5e5ef3e54fb4122a3ba09a55357f9ab.ecs.us-west-1.on.aws'];
  return [
    "default-src 'self'", "base-uri 'none'", "object-src 'none'",
    `script-src 'self' ${[...scripts, ...new Set(hashes)].join(' ')}`,
    "script-src-attr 'none'",
    // Existing responsive layouts and Google sign-in use style attributes.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://accounts.google.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:", "media-src 'self' https://videos.pexels.com",
    `connect-src 'self' ${connections.join(' ')}`,
    `frame-src 'self' ${admin ? 'https://accounts.google.com https://www.facebook.com' : 'https://www.facebook.com https://www.googletagmanager.com'}`,
    `form-action 'self' https://formsubmit.co${admin ? '' : ' https://www.facebook.com/tr/'}`, "worker-src 'self' blob:"
  ].join('; ');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let changed = 0;
  for (const file of htmlFiles) {
    const source = readFileSync(file, 'utf8');
    const clean = source.replace(/^[\t ]*<meta\s+http-equiv="Content-Security-Policy"[^>]*>[\t ]*\r?\n?/gmi, '')
      .replace(/^[\t ]*<meta\s+name="referrer"[^>]*>[\t ]*\r?\n?/gmi, '');
    const policy = securityPolicy(clean, relative(root, file).startsWith('admin/'));
    const tags = `\n<meta http-equiv="Content-Security-Policy" content="${policy}" />\n<meta name="referrer" content="strict-origin-when-cross-origin" />`;
    // Policy must precede scripts, links and other active content. Keep charset first.
    const charset = /<meta\s+charset=[^>]+>/i;
    const next = charset.test(clean) ? clean.replace(charset, value => value + tags)
      : clean.replace(/<head\b[^>]*>/i, value => value + tags);
    if (next !== source) {
      changed++;
      if (!check) writeFileSync(file, next);
    }
  }
  if (check && changed) throw new Error(`${changed} security policies need synchronization`);
  console.log(`PASS: ${htmlFiles.length} HTML security policies ${check ? 'verified' : 'synchronized'}. HTTP-only headers are not provided by this meta policy.`);
}
