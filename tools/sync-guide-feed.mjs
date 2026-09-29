// Regenerate only existing full-text feed entries; publication dates and GUIDs stay unchanged.
import {readFileSync,writeFileSync} from 'node:fs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const origin = 'https://wecocompany.com/';
const files = ['brand-consulting-guide.html', 'spatial-branding-guide.html', 'commercial-interior-quote-checklist.html', 'meat-restaurant-startup-interior.html', 'restaurant-startup-reality.html', 'hair-salon-interior-process-guide.html'];
let feed = read('rss.xml');
for (const file of files) {
  const html = read(file);
  // The page's outer article may contain nested articles. Match until main ends, not first </article>.
  const start = html.indexOf('<article>'), end = html.lastIndexOf('</article>');
  if(start < 0 || end < start) throw new Error(`Missing article: ${file}`);
  const article = html.slice(start, end + '</article>'.length).replace(/href="([^"]+)"/g, (_, href) => `href="${new URL(href, origin + file).href}"`);
  let count = 0;
  feed = feed.replace(/<item>[\s\S]*?<\/item>/g, item => {
    if (!item.includes(`<link>${origin}${file}</link>`)) return item;
    count++;
    if(!item.includes('<content:encoded>')) return item; // Keep summary-only entries summary-only.
    return item.replace(/<content:encoded>[\s\S]*?<\/content:encoded>/, `<content:encoded><![CDATA[${article}]]></content:encoded>`);
  });
  if(count !== 1) throw new Error(`Expected one feed item: ${file}`);
}
if(!process.argv.includes('--check')) feed = feed.replace(/<lastBuildDate>[^<]+<\/lastBuildDate>/, `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`);
if(process.argv.includes('--check')) {
  if(feed !== read('rss.xml')) throw new Error('RSS content is out of sync');
} else {
  writeFileSync(new URL('../rss.xml', import.meta.url), feed);
}
console.log('PASS: existing feed content synchronized, publication dates and GUIDs preserved.');
