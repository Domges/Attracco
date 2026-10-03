// Scarica le fotografie indicate in images.sources.json da Wikimedia Commons,
// accettando solo licenze compatibili con l'uso commerciale, e registra autore,
// licenza e fonte in src/data/photo-credits.json (usato dal sito per i crediti).
//
// Uso: npm run images:fetch            (salta le immagini già scaricate)
//      npm run images:fetch -- --force  (riscarica tutto)

import { mkdir, readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const SOURCES = new URL("images.sources.json", ROOT);
const CREDITS = new URL("src/data/photo-credits.json", ROOT);
const OUT_DIR = new URL("public/images/photos/", ROOT);
const API = "https://commons.wikimedia.org/w/api.php";
// Wikimedia richiede uno User-Agent identificabile con un contatto.
const USER_AGENT = "AttraccoImageFetcher/1.0 (https://attracco.app; [email di contatto])";
// Larghezza standard servita dalla cache miniature di Wikimedia.
const WIDTH = 1280;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Licenze ammesse: pubblico dominio, CC0, CC BY e CC BY-SA (attribuzione gestita dal sito).
// Escluse: licenze NC/ND, GFDL-only e qualunque altra non riconosciuta.
const ALLOWED = [/^cc0/i, /^public domain/i, /^pd/i, /^cc by(-sa)? \d(\.\d)?$/i];

const force = process.argv.includes("--force");

// Wikimedia risponde 429 se si superano i limiti: si riprova rispettando Retry-After.
async function politeFetch(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.status !== 429 || attempt >= 6) return res;
    const wait = Math.max(Number(res.headers.get("retry-after")) || 0, 5 * attempt) * 1000;
    await pause(wait + 1000);
  }
}
const stripHtml = (s) => (s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function commonsInfo(title) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: String(WIDTH),
  });
  const res = await politeFetch(url);
  if (!res.ok) throw new Error(`API Commons: HTTP ${res.status}`);
  const page = (await res.json()).query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error("file non trovato su Commons");
  return { page, info };
}

const sources = JSON.parse(await readFile(SOURCES, "utf8"));
const credits = JSON.parse(await readFile(CREDITS, "utf8").catch(() => "{}"));
await mkdir(OUT_DIR, { recursive: true });

let failures = 0;
for (const [key, title] of Object.entries(sources)) {
  if (key.startsWith("_")) continue;
  if (typeof title !== "string" || !title.startsWith("File:")) {
    console.log(`- ${key}: nessun file indicato, resta l'illustrazione`);
    continue;
  }
  if (credits[key] && `File:${credits[key].title}` === title && !force) {
    console.log(`= ${key}: già scaricata`);
    continue;
  }
  try {
    const { page, info } = await commonsInfo(title);
    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value);
    if (!ALLOWED.some((re) => re.test(license))) throw new Error(`licenza non ammessa: "${license || "sconosciuta"}"`);
    const restrictions = stripHtml(meta.Restrictions?.value);
    if (restrictions) throw new Error(`restrizioni non di copyright segnalate (${restrictions}): verificare manualmente`);
    if (!/^image\/(jpeg|png|webp)$/.test(info.mime)) throw new Error(`formato non supportato: ${info.mime}`);

    // Le miniature sono servite anche da upload.wikimedia.org (stesso percorso).
    const imgUrl = (info.thumburl ?? info.url).split("?")[0].replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/");
    const imgRes = await politeFetch(imgUrl);
    if (!imgRes.ok) throw new Error(`download: HTTP ${imgRes.status}`);
    const ext = info.mime === "image/png" ? "png" : info.mime === "image/webp" ? "webp" : "jpg";
    await writeFile(new URL(`${key}.${ext}`, OUT_DIR), Buffer.from(await imgRes.arrayBuffer()));

    credits[key] = {
      file: `/images/photos/${key}.${ext}`,
      title: page.title.replace(/^File:/, ""),
      author: stripHtml(meta.Artist?.value) || "autore non indicato",
      license,
      licenseUrl: meta.LicenseUrl?.value ?? null,
      sourceUrl: info.descriptionurl,
      retrievedAt: new Date().toISOString().slice(0, 10),
    };
    await pause(2000); // rispetto dei limiti di frequenza di Wikimedia
    console.log(`+ ${key}: ${credits[key].title} — ${credits[key].author}, ${license}`);
  } catch (err) {
    failures++;
    console.error(`! ${key}: ${err.message}`);
  }
}

await writeFile(CREDITS, JSON.stringify(credits, null, 2) + "\n");
console.log(`Crediti aggiornati in src/data/photo-credits.json${failures ? ` (${failures} errori)` : ""}.`);
process.exitCode = failures ? 1 : 0;
