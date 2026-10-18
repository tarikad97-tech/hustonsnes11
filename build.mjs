import fs from 'node:fs'; import path from 'node:path';
const cfg = JSON.parse(fs.readFileSync('config/site.json','utf8'));
const arts = JSON.parse(fs.readFileSync('data/articles.json','utf8')).filter(a=>a.published)
  .sort((a,b)=>b.date.localeCompare(a.date));
const cats = cfg.categories, D = 'dist';
fs.rmSync(D,{recursive:true,force:true});
const w=(p,c)=>{const f=path.join(D,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c)};
const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const ld=o=>`<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const analytics = cfg.analyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${e(cfg.analyticsId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${e(cfg.analyticsId)}')</script>` : '';
const page=({title,desc,url,body,noindex,og='website',extra=''})=>`<!doctype html>
<html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(title)}</title><meta name="description" content="${e(desc)}">
<link rel="canonical" href="${cfg.url}${url}">${noindex?'<meta name="robots" content="noindex,follow">':''}
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:type" content="${og}"><meta property="og:url" content="${cfg.url}${url}"><meta property="og:site_name" content="${e(cfg.name)}">
<link rel="stylesheet" href="/assets/css/style.css">${extra}${analytics}</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap bar"><a class="logo" href="/">${e(cfg.name)}</a>
<nav aria-label="Main"><ul>${cats.map(c=>`<li><a href="/${c.slug}/">${e(c.title)}</a></li>`).join('')}</ul></nav></div></header>
<main id="main">${body}</main>
<footer class="site-footer"><div class="wrap"><p><strong>${e(cfg.name)}</strong> is an independent guide and is not affiliated with the City of Houston or any business.</p>
<ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/privacy-policy/">Privacy Policy</a></li><li><a href="/editorial-policy/">Editorial Policy</a></li><li><a href="/corrections-policy/">Corrections Policy</a></li></ul></div></footer></body></html>`;
const card=a=>`<article class="card"><h3><a href="/${a.category}/${a.slug}/">${e(a.title)}</a></h3><p>${e(a.description)}</p><p class="meta">${e(cats.find(c=>c.slug===a.category)?.title||'')} · ${a.updated||a.date}</p></article>`;
const grid=list=>list.length?`<div class="grid">${list.map(card).join('')}</div>`:`<p class="empty">Guides for this section are being researched and will be published after fact-checking against official sources.</p>`;
const search=`<form class="search" action="/search/" method="get" role="search"><label for="q">Search guides</label><div><input id="q" name="q" type="search" required autocomplete="off"><button type="submit">Search</button></div></form>`;
// Home
w('index.html',page({title:`${cfg.name} — Free, Family & Outdoor Things to Do in Houston`,desc:cfg.tagline,url:'/',
 extra:ld({'@context':'https://schema.org','@type':'WebSite',name:cfg.name,url:cfg.url}),
 body:`<section class="hero"><div class="wrap"><h1>Find something good to do in Houston</h1><p>${e(cfg.tagline)}</p>${search}</div></section>
 <div class="wrap"><nav class="chips" aria-label="Categories">${cats.map(c=>`<a href="/${c.slug}/">${e(c.title)}</a>`).join('')}</nav>
 ${cats.filter(c=>c.slug!=='events').map(c=>`<section><h2>${e(c.title)}</h2>${grid(arts.filter(a=>a.category===c.slug).slice(0,3))}<p><a href="/${c.slug}/">All ${e(c.title.toLowerCase())} →</a></p></section>`).join('')}
 <section><h2>Latest guides</h2>${grid(arts.slice(0,6))}</section></div>`}));
// Categories
for(const c of cats) w(`${c.slug}/index.html`,page({title:`${c.title} in Houston | ${cfg.name}`,desc:c.intro,url:`/${c.slug}/`,
 body:`<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / ${e(c.title)}</nav><h1>${e(c.title)} in Houston</h1><p class="lead">${e(c.intro)}</p>${grid(arts.filter(a=>a.category===c.slug))}</div>`}));
// Articles
for(const a of arts){const c=cats.find(x=>x.slug===a.category);const html=fs.readFileSync(`content/${a.slug}.html`,'utf8');
 const rel=arts.filter(x=>x.slug!==a.slug&&x.category===a.category).slice(0,3);
 w(`${a.category}/${a.slug}/index.html`,page({title:`${a.title} | ${cfg.name}`,desc:a.description,url:`/${a.category}/${a.slug}/`,og:'article',
 extra:ld({'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,datePublished:a.date,dateModified:a.updated||a.date,author:{'@type':a.authorType||'Person',name:a.author},image:a.image?cfg.url+a.image:undefined})+ld({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['Home','/'],[c.title,`/${c.slug}/`],[a.title,`/${a.category}/${a.slug}/`]].map((x,i)=>({'@type':'ListItem',position:i+1,name:x[0],item:cfg.url+x[1]}))}),
 body:`<article class="wrap article"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/${c.slug}/">${e(c.title)}</a></nav><h1>${e(a.title)}</h1><p class="meta">By ${e(a.author)} · Published ${a.date}${a.updated?` · Updated ${a.updated}`:''}${a.checked?` · Details checked ${a.checked}`:''}</p>
 ${a.image?`<img src="${a.image}" alt="${e(a.imageAlt||'')}" width="${a.imageWidth}" height="${a.imageHeight}">`:''}${html}
 ${a.sources?.length?`<h2>Sources</h2><ul>${a.sources.map(s=>`<li><a href="${e(s.url)}" rel="noopener">${e(s.label)}</a></li>`).join('')}</ul>`:''}
 ${rel.length?`<h2>Related guides</h2>${grid(rel)}`:''}<p><a href="/${c.slug}/">← Back to ${e(c.title)}</a></p></article>`}));}
// Policies
const contact=cfg.contact.email?`<p>Email: <a href="mailto:${e(cfg.contact.email)}">${e(cfg.contact.email)}</a></p>`:`<p>Contact details will be published here before launch.</p>`;
const pol={about:['About',`<p>${e(cfg.name)} is an independent local guide to things to do in Houston, Texas. It is not an official city site and is not affiliated with any restaurant, business or government body.</p>${cfg.editor?`<p>Editor: ${e(cfg.editor)}</p>`:''}`],
 contact:['Contact',contact],
 'privacy-policy':['Privacy Policy',`<p>This site is a static website. By default it collects no personal data and sets no cookies.</p><p>If analytics or advertising are enabled later, this policy must be updated first to name those services, the data they collect, cookies used and how visitors can opt out or give consent.</p><p>Site search runs in your browser and queries are not sent to a server.</p>`],
 'editorial-policy':['Editorial Policy',`<p>Guides are written to answer a specific question and are checked against official sources such as park, venue and city websites. Prices, hours and schedules change, so confirm with the source before you go. We separate confirmed facts from estimates and never present unverified details as certain. We do not claim first-hand visits unless they happened.</p>`],
 'corrections-policy':['Corrections Policy',`<p>If you find an error, contact us with the page and the correction. We verify reports against official sources, fix confirmed errors promptly and mark the page with an updated date.</p>`]};
for(const [s,[t,b]] of Object.entries(pol)) w(`${s}/index.html`,page({title:`${t} | ${cfg.name}`,desc:`${t} for ${cfg.name}.`,url:`/${s}/`,body:`<div class="wrap article"><h1>${t}</h1>${b}</div>`}));
// Search, 404, data
w('search/index.html',page({title:`Search | ${cfg.name}`,desc:'Search Houston guides.',url:'/search/',noindex:true,body:`<div class="wrap"><h1>Search</h1>${search}<div id="results" aria-live="polite"></div></div><script src="/assets/js/search.js" defer></script>`}));
w('search-index.json',JSON.stringify(arts.map(a=>({t:a.title,d:a.description,c:cats.find(c=>c.slug===a.category)?.title,k:a.keywords||[],u:`/${a.category}/${a.slug}/`}))));
w('404.html',page({title:`Page not found | ${cfg.name}`,desc:'Page not found.',url:'/404.html',noindex:true,body:`<div class="wrap"><h1>Page not found</h1><p>Try a category or search:</p>${search}<nav class="chips">${cats.map(c=>`<a href="/${c.slug}/">${e(c.title)}</a>`).join('')}</nav></div>`}));
const urls=['/',...cats.map(c=>`/${c.slug}/`),...Object.keys(pol).map(s=>`/${s}/`),...arts.map(a=>`/${a.category}/${a.slug}/`)];
w('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${cfg.url}${u}</loc></url>`).join('')}</urlset>`);
w('robots.txt',`User-agent: *\nAllow: /\nDisallow: /search/\n\nSitemap: ${cfg.url}/sitemap.xml\n`);
if(cfg.adsensePublisherId) w('ads.txt',`google.com, ${cfg.adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`);
fs.cpSync('assets',`${D}/assets`,{recursive:true});
console.log(`Built ${urls.length} pages, ${arts.length} articles`);
