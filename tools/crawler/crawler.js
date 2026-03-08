#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULTS = {
  maxPages: 2000,
  concurrency: 5,
  delayMs: 0,
  timeoutMs: 12000,
  retries: 2,
  retryDelayMs: 1500,
  includeSubdomains: false,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  outputDir: path.join(__dirname, "output"),
};

function printHelp() {
  const helpText = `
Site URL crawler (same-domain)

Usage:
  node tools/crawler/crawler.js --url https://example.com [options]

Options:
  --url <value>                  Start URL (required)
  --max-pages <number>           Maximum pages to crawl (default: ${DEFAULTS.maxPages})
  --concurrency <number>         Parallel requests (default: ${DEFAULTS.concurrency})
  --delay <ms>                   Delay after each request in ms (default: ${DEFAULTS.delayMs})
  --timeout <ms>                 Request timeout in ms (default: ${DEFAULTS.timeoutMs})
  --retries <number>             Retry times for failed requests (default: ${DEFAULTS.retries})
  --retry-delay <ms>             Delay between retries in ms (default: ${DEFAULTS.retryDelayMs})
  --include-subdomains           Also crawl subdomains (default: false)
  --cookie <value>               Cookie header, e.g. "cf_clearance=...; other=..."
  --cookie-file <path>           Read cookie header from file
  --user-agent <value>           Custom User-Agent string
  --output <dir>                 Output directory (default: tools/crawler/output)
  --help                         Show this help

Outputs:
  urls.txt                       One URL per line
  urls.json                      JSON array of URLs
`;
  process.stdout.write(helpText);
}

function parseInteger(value, optionName, min = 1) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < min) {
    throw new Error(`Invalid value for ${optionName}: ${value}`);
  }
  return n;
}

function parseArgs(argv) {
  const options = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--include-subdomains") {
      options.includeSubdomains = true;
      continue;
    }
    if (arg.startsWith("--url=")) {
      options.url = arg.slice("--url=".length);
      continue;
    }
    if (arg === "--url") {
      options.url = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--max-pages=")) {
      options.maxPages = parseInteger(arg.slice("--max-pages=".length), "--max-pages");
      continue;
    }
    if (arg === "--max-pages") {
      options.maxPages = parseInteger(argv[i + 1], "--max-pages");
      i += 1;
      continue;
    }
    if (arg.startsWith("--concurrency=")) {
      options.concurrency = parseInteger(arg.slice("--concurrency=".length), "--concurrency");
      continue;
    }
    if (arg === "--concurrency") {
      options.concurrency = parseInteger(argv[i + 1], "--concurrency");
      i += 1;
      continue;
    }
    if (arg.startsWith("--delay=")) {
      options.delayMs = parseInteger(arg.slice("--delay=".length), "--delay", 0);
      continue;
    }
    if (arg === "--delay") {
      options.delayMs = parseInteger(argv[i + 1], "--delay", 0);
      i += 1;
      continue;
    }
    if (arg.startsWith("--timeout=")) {
      options.timeoutMs = parseInteger(arg.slice("--timeout=".length), "--timeout");
      continue;
    }
    if (arg === "--timeout") {
      options.timeoutMs = parseInteger(argv[i + 1], "--timeout");
      i += 1;
      continue;
    }
    if (arg.startsWith("--retries=")) {
      options.retries = parseInteger(arg.slice("--retries=".length), "--retries", 0);
      continue;
    }
    if (arg === "--retries") {
      options.retries = parseInteger(argv[i + 1], "--retries", 0);
      i += 1;
      continue;
    }
    if (arg.startsWith("--retry-delay=")) {
      options.retryDelayMs = parseInteger(arg.slice("--retry-delay=".length), "--retry-delay", 0);
      continue;
    }
    if (arg === "--retry-delay") {
      options.retryDelayMs = parseInteger(argv[i + 1], "--retry-delay", 0);
      i += 1;
      continue;
    }
    if (arg.startsWith("--cookie=")) {
      options.cookie = arg.slice("--cookie=".length);
      continue;
    }
    if (arg === "--cookie") {
      options.cookie = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--cookie-file=")) {
      options.cookieFile = path.resolve(process.cwd(), arg.slice("--cookie-file=".length));
      continue;
    }
    if (arg === "--cookie-file") {
      options.cookieFile = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--user-agent=")) {
      options.userAgent = arg.slice("--user-agent=".length);
      continue;
    }
    if (arg === "--user-agent") {
      options.userAgent = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      options.outputDir = path.resolve(process.cwd(), arg.slice("--output=".length));
      continue;
    }
    if (arg === "--output") {
      options.outputDir = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function normalizeUrl(rawUrl, baseUrl) {
  try {
    const u = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null;
    }

    u.hash = "";
    if ((u.protocol === "http:" && u.port === "80") || (u.protocol === "https:" && u.port === "443")) {
      u.port = "";
    }

    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "gclid" || key === "fbclid") {
        u.searchParams.delete(key);
      }
    }

    u.pathname = u.pathname.replace(/\/{2,}/g, "/");
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }

    return u.toString();
  } catch {
    return null;
  }
}

function isAllowedHost(hostname, rootHost, includeSubdomains) {
  if (hostname === rootHost) {
    return true;
  }
  if (!includeSubdomains) {
    return false;
  }
  return hostname.endsWith(`.${rootHost}`);
}

function extractLinks(html) {
  const links = [];
  const hrefRegex = /<a\s[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'<>`]+))/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    links.push(match[1] || match[2] || match[3]);
  }

  return links;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function detectBotChallenge(status, html) {
  if (status !== 403 && status !== 429) {
    return false;
  }

  return /verifying your connection|challenge-platform|__cf_chl_|cloudflare/i.test(html);
}

async function fetchPage(url, timeoutMs, requestHeaders) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: requestHeaders,
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const botChallenge = detectBotChallenge(response.status, text);

    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url || url,
      contentType,
      body: text,
      botChallenge,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      contentType: "",
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function crawlSite(options) {
  const startUrl = normalizeUrl(options.url);
  if (!startUrl) {
    throw new Error("Invalid --url value.");
  }

  const rootHost = new URL(startUrl).hostname;
  const queue = [startUrl];
  const queued = new Set(queue);
  const visited = new Set();
  const found = new Set(queue);
  let active = 0;
  let failedCount = 0;
  let blockedCount = 0;

  const requestHeaders = {
    "User-Agent": options.userAgent,
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  };
  if (options.cookie) {
    requestHeaders.Cookie = options.cookie;
  }

  function enqueue(raw, base) {
    const normalized = normalizeUrl(raw, base);
    if (!normalized) {
      return;
    }

    let u;
    try {
      u = new URL(normalized);
    } catch {
      return;
    }

    if (!isAllowedHost(u.hostname, rootHost, options.includeSubdomains)) {
      return;
    }

    found.add(normalized);
    if (!visited.has(normalized) && !queued.has(normalized)) {
      queue.push(normalized);
      queued.add(normalized);
    }
  }

  async function runOne(url) {
    if (visited.size >= options.maxPages) {
      return;
    }

    visited.add(url);
    process.stdout.write(`[${visited.size}/${options.maxPages}] ${url}\n`);

    let page = null;
    for (let attempt = 0; attempt <= options.retries; attempt += 1) {
      if (attempt > 0) {
        await sleep(options.retryDelayMs);
      }
      page = await fetchPage(url, options.timeoutMs, requestHeaders);
      if (page.ok && !page.botChallenge) {
        break;
      }
    }

    if (!page.ok) {
      failedCount += 1;
      const reason = page.error ? ` (${page.error})` : "";
      process.stderr.write(`  ! Failed ${page.status}: ${url}${reason}\n`);
      if (page.botChallenge) {
        blockedCount += 1;
        process.stderr.write("  ! Blocked by anti-bot challenge. Try --cookie with browser cf_clearance.\n");
      }
      return;
    }
    if (page.botChallenge) {
      blockedCount += 1;
      process.stderr.write(`  ! Blocked by anti-bot challenge: ${url}\n`);
      process.stderr.write("  ! Try --cookie with browser cf_clearance.\n");
      return;
    }

    enqueue(page.finalUrl, url);

    if (!/text\/html|application\/xhtml\+xml/i.test(page.contentType)) {
      return;
    }

    for (const link of extractLinks(page.body)) {
      enqueue(link, page.finalUrl || url);
    }

    if (options.delayMs > 0) {
      await sleep(options.delayMs);
    }
  }

  return new Promise((resolve) => {
    let done = false;

    function finish() {
      if (done) {
        return;
      }
      done = true;
      resolve({
        urls: [...found].sort((a, b) => a.localeCompare(b)),
        stats: {
          visited: visited.size,
          failed: failedCount,
          blocked: blockedCount,
        },
      });
    }

    function schedule() {
      if (done) {
        return;
      }

      if (visited.size >= options.maxPages) {
        finish();
        return;
      }

      while (active < options.concurrency && queue.length > 0 && visited.size < options.maxPages) {
        const nextUrl = queue.shift();
        if (!nextUrl || visited.has(nextUrl)) {
          continue;
        }

        active += 1;
        runOne(nextUrl)
          .catch((error) => {
            process.stderr.write(`  ! Unexpected error: ${String(error)}\n`);
          })
          .finally(() => {
            active -= 1;
            if ((queue.length === 0 && active === 0) || visited.size >= options.maxPages) {
              finish();
              return;
            }
            schedule();
          });
      }

      if (queue.length === 0 && active === 0) {
        finish();
      }
    }

    schedule();
  });
}

async function writeOutput(urls, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  const txtPath = path.join(outputDir, "urls.txt");
  const jsonPath = path.join(outputDir, "urls.json");

  await fs.writeFile(txtPath, urls.join("\n"), "utf8");
  await fs.writeFile(jsonPath, JSON.stringify(urls, null, 2), "utf8");

  return { txtPath, jsonPath };
}

async function readCookieFromFile(cookieFilePath) {
  try {
    const raw = await fs.readFile(cookieFilePath, "utf8");
    const cookie = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .join("; ");

    return cookie;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(
        `Cookie file not found: ${cookieFilePath}\nCreate this file or use --cookie "cf_clearance=...; other=...".`
      );
    }
    throw error;
  }
}

async function main() {
  if (typeof fetch !== "function") {
    throw new Error("This crawler requires Node.js 18+ (global fetch is missing).");
  }

  const options = parseArgs(process.argv.slice(2));

  if (options.cookieFile) {
    options.cookie = await readCookieFromFile(options.cookieFile);
    if (!options.cookie) {
      process.stderr.write("! Cookie file is empty. Crawling without Cookie header.\n");
    }
  }

  if (options.help || !options.url) {
    printHelp();
    process.exit(options.help ? 0 : 1);
  }

  const startedAt = Date.now();
  process.stdout.write(`Start crawling: ${options.url}\n`);
  process.stdout.write(`Max pages: ${options.maxPages}, Concurrency: ${options.concurrency}\n`);

  const { urls, stats } = await crawlSite(options);
  const { txtPath, jsonPath } = await writeOutput(urls, options.outputDir);
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  process.stdout.write(`\nDone in ${elapsedSec}s\n`);
  process.stdout.write(`Found ${urls.length} unique URLs\n`);
  process.stdout.write(`Visited pages: ${stats.visited}, Failed: ${stats.failed}, Blocked: ${stats.blocked}\n`);
  process.stdout.write(`TXT: ${txtPath}\n`);
  process.stdout.write(`JSON: ${jsonPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
