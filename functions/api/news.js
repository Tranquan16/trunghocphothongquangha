const SOURCE_ORIGIN = "https://thptquangha.phutho.edu.vn";
const SOURCE_HOME = `${SOURCE_ORIGIN}/`;

function decodeEntities(value) {
    return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code) => {
        if (code[0] === "#") {
            const numeric = code[1].toLowerCase() === "x"
                ? Number.parseInt(code.slice(2), 16)
                : Number.parseInt(code.slice(1), 10);
            return Number.isFinite(numeric) && numeric <= 0x10ffff
                ? String.fromCodePoint(numeric)
                : entity;
        }

        return {
            amp: "&",
            lt: "<",
            gt: ">",
            quot: "\"",
            apos: "'",
            nbsp: " "
        }[code.toLowerCase()];
    });
}

function htmlToText(value) {
    return decodeEntities(
        value
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
            .replace(/<!--[\s\S]*?-->/g, " ")
            .replace(/<\/(?:p|div|br|li|h[1-6])\s*>/gi, "\n")
            .replace(/<[^>]+>/g, " ")
    )
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .trim();
}

function getAttribute(attributes, name) {
    const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
    return match ? decodeEntities(match[2]) : "";
}

function safeSourceUrl(value) {
    if (!value) {
        return "";
    }

    try {
        const url = new URL(value, SOURCE_ORIGIN);
        return url.origin === SOURCE_ORIGIN ? url.href : "";
    } catch {
        return "";
    }
}

async function fetchSource(path) {
    const response = await fetch(new URL(path, SOURCE_ORIGIN), {
        headers: { Accept: "text/html" }
    });

    if (!response.ok) {
        throw new Error(`Website trường trả về mã ${response.status}.`);
    }

    return response.text();
}

function parseNews(html) {
    const articles = [];
    const seenPaths = new Set();
    const anchorPattern = /<a\b([^>]*\bhref\s*=\s*(["'])(\/tin-tuc-su-kien\/[^"']+?\.html(?:\?[^"']*)?)\2[^>]*)>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = anchorPattern.exec(html)) !== null && articles.length < 12) {
        const attributes = match[1];
        const path = match[3].split("?")[0];
        if (seenPaths.has(path)) {
            continue;
        }

        const title = getAttribute(attributes, "title") || htmlToText(match[4]);
        if (!title) {
            continue;
        }

        seenPaths.add(path);
        const followingMarkup = html.slice(anchorPattern.lastIndex, anchorPattern.lastIndex + 5000);
        const dateMatch = followingMarkup.match(/class=["']titl-time["'][^>]*>[\s\S]*?<\/span>\s*<span[^>]*>([^<]+)<\/span>/i);
        const summaryMatch = followingMarkup.match(/class=["']brief["'][^>]*>([\s\S]*?)<\/div>/i);
        const imageMarkup = match[4].match(/<img\b([^>]*)>/i);
        const imageAttributes = imageMarkup ? imageMarkup[1] : "";
        const imagePath = getAttribute(imageAttributes, "data-original") || getAttribute(imageAttributes, "src");

        articles.push({
            title,
            path,
            image: safeSourceUrl(imagePath),
            date: dateMatch ? htmlToText(dateMatch[1]) : "",
            summary: summaryMatch ? htmlToText(summaryMatch[1]).slice(0, 320) : ""
        });
    }

    return articles;
}

function parseArticle(html) {
    const contentStart = html.search(/<div\b[^>]*class=["'][^"']*\bcontent-detail\b/i);
    if (contentStart < 0) {
        throw new Error("Không tìm thấy nội dung bài viết trên website trường.");
    }

    const articleEnd = html.indexOf("</article>", contentStart);
    const content = html.slice(contentStart, articleEnd < 0 ? undefined : articleEnd);
    const paragraphs = [...content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((paragraph) => htmlToText(paragraph[1]))
        .filter((paragraph) => paragraph.length > 0);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    if (paragraphs.length === 0) {
        throw new Error("Bài viết chưa có nội dung để hiển thị.");
    }

    return {
        title: titleMatch ? htmlToText(titleMatch[1]) : "",
        paragraphs
    };
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

export async function onRequest({ request }) {
    if (request.method !== "GET") {
        return jsonResponse({ error: "Phương thức không được hỗ trợ." }, 405);
    }

    const requestUrl = new URL(request.url);
    const articlePath = requestUrl.searchParams.get("path");

    try {
        if (articlePath) {
            const parsedPath = new URL(articlePath, SOURCE_ORIGIN);
            if (
                parsedPath.origin !== SOURCE_ORIGIN
                || !/^\/tin-tuc-su-kien\/[a-zA-Z0-9/_-]+\.html$/.test(parsedPath.pathname)
            ) {
                return jsonResponse({ error: "Đường dẫn bài viết không hợp lệ." }, 400);
            }

            const article = parseArticle(await fetchSource(parsedPath.pathname));
            return jsonResponse(article);
        }

        const articles = parseNews(await fetchSource(SOURCE_HOME));
        if (articles.length === 0) {
            throw new Error("Không tìm thấy tin tức trên website trường.");
        }

        return jsonResponse({ articles });
    } catch (error) {
        console.error("Không thể lấy dữ liệu từ website THPT Quang Hà:", error);
        return jsonResponse({ error: error.message || "Lỗi khi lấy dữ liệu từ website trường." }, 502);
    }
}
