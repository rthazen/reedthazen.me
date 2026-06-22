// pages/api/link-preview.ts
// Fetches a URL server-side and extracts Open Graph / Twitter card metadata so
// the client can render an image preview for links pasted into a selection.
// Hardened against SSRF: only http(s), and the resolved host must be public.
import type { NextApiRequest, NextApiResponse } from 'next';
import dns from 'dns';
import net from 'net';

type Preview = {
    url: string;
    image?: string;
    title?: string;
    description?: string;
    siteName?: string;
    error?: string;
};

const TTL_MS = 1000 * 60 * 60 * 24; // 24h
const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 300_000;
const cache = new Map<string, { at: number; data: Preview }>();

function isPrivateIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        if (a === 0 || a === 10 || a === 127) return true;
        if (a === 169 && b === 254) return true; // link-local
        if (a === 192 && b === 168) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
        return false;
    }
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower.startsWith('::ffff:')) return isPrivateIp(lower.slice(7)); // v4-mapped
    return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        throw new Error('Invalid URL');
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Unsupported protocol');
    const host = u.hostname;
    if (host === 'localhost' || host.endsWith('.local')) throw new Error('Blocked host');
    if (net.isIP(host)) {
        if (isPrivateIp(host)) throw new Error('Blocked host');
    } else {
        const addrs = await dns.promises.lookup(host, { all: true });
        if (addrs.some((a) => isPrivateIp(a.address))) throw new Error('Blocked host');
    }
    return u;
}

function decodeEntities(s: string): string {
    return s
        .replace(/&#(\d+);/g, (_, n) => {
            try {
                return String.fromCodePoint(parseInt(n, 10));
            } catch {
                return _;
            }
        })
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
            try {
                return String.fromCodePoint(parseInt(n, 16));
            } catch {
                return _;
            }
        })
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
}

function metaContent(html: string, key: string): string | undefined {
    const k = key.replace(/[:]/g, '\\:');
    const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*?content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name)=["']${k}["']`, 'i')
    ];
    for (const re of patterns) {
        const m = html.match(re);
        if (m && m[1]) return decodeEntities(m[1].trim());
    }
    return undefined;
}

function parseMeta(html: string, u: URL): Preview {
    const rawImage = metaContent(html, 'og:image') || metaContent(html, 'twitter:image') || metaContent(html, 'twitter:image:src');
    const title = metaContent(html, 'og:title') || decodeEntities((html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim());
    const description = metaContent(html, 'og:description') || metaContent(html, 'description');
    const siteName = metaContent(html, 'og:site_name') || u.hostname.replace(/^www\./, '');

    let image = rawImage;
    if (image) {
        try {
            image = new URL(image, u).toString(); // resolve protocol-relative / relative paths
        } catch {
            image = undefined;
        }
    }
    return {
        url: u.toString(),
        image,
        title: title || undefined,
        description: description || undefined,
        siteName
    };
}

async function fetchPreview(u: URL): Promise<Preview> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(u.toString(), {
            signal: ctrl.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ADUChecklistBot/1.0; +https://reedthazen.me)',
                Accept: 'text/html,application/xhtml+xml'
            }
        });
        const ctype = res.headers.get('content-type') || '';
        if (ctype.startsWith('image/')) return { url: u.toString(), image: u.toString(), siteName: u.hostname.replace(/^www\./, '') };
        if (!ctype.includes('html')) return { url: u.toString(), siteName: u.hostname.replace(/^www\./, '') };

        // Read the body but cap how much we buffer (og tags live in <head>).
        const reader = res.body?.getReader();
        if (!reader) return { url: u.toString() };
        const decoder = new TextDecoder();
        let html = '';
        while (html.length < MAX_HTML_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            html += decoder.decode(value, { stream: true });
            if (html.includes('</head>')) break; // everything we need is parsed
        }
        try {
            await reader.cancel();
        } catch {}
        return parseMeta(html, u);
    } finally {
        clearTimeout(timer);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Preview>) {
    const raw = String(req.query.url ?? '').trim();
    if (!raw) return res.status(400).json({ url: '', error: 'Missing url' });

    // IMPORTANT: use `private` (browser-only) caching. A shared CDN may key its
    // cache by path and ignore the `?url=` query string, which would serve one
    // link's preview for every link. Browsers always key by full URL, so private
    // caching keeps each link's preview correct. The origin keeps its own
    // per-URL in-memory cache below to avoid refetching.
    const ok = (p: Preview) => !!(p.title || p.image);
    const hit = cache.get(raw);
    if (hit && Date.now() - hit.at < TTL_MS) {
        res.setHeader('Cache-Control', 'private, max-age=3600');
        return res.status(200).json(hit.data);
    }

    try {
        const u = await assertPublicUrl(raw);
        const data = await fetchPreview(u);
        if (ok(data)) {
            // Only cache successful previews so a transient block/empty result
            // doesn't get stuck — the next request will retry.
            cache.set(raw, { at: Date.now(), data });
            res.setHeader('Cache-Control', 'private, max-age=3600');
        } else {
            res.setHeader('Cache-Control', 'private, max-age=120');
        }
        return res.status(200).json(data);
    } catch (e: any) {
        // Return 200 so the client can gracefully fall back to a plain link.
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ url: raw, error: e?.message || 'Could not load preview' });
    }
}

export const config = { api: { responseLimit: '1mb' } };
