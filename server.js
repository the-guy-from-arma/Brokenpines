const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg"
};

function sendError(response, statusCode) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(http.STATUS_CODES[statusCode] || "Error");
}

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requestedPath = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.resolve(publicDir, `.${requestedPath}`);

  if (!filePath.startsWith(publicDir)) {
    return null;
  }

  return filePath;
}

function serveFile(request, response, filePath) {
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      const fallback = path.join(publicDir, "index.html");
      if (path.extname(filePath)) {
        sendError(response, 404);
        return;
      }
      serveFile(request, response, fallback);
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || "application/octet-stream";
    const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);
    const baseHeaders = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": isAsset
        ? "public, max-age=31536000, immutable"
        : "no-cache"
    };

    const range = request.headers.range;
    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        sendError(response, 416);
        return;
      }

      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;

      if (start >= stat.size || end >= stat.size || start > end) {
        response.writeHead(416, {
          ...baseHeaders,
          "Content-Range": `bytes */${stat.size}`
        });
        response.end();
        return;
      }

      response.writeHead(206, {
        ...baseHeaders,
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      fs.createReadStream(filePath, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, {
      ...baseHeaders,
      "Content-Length": stat.size
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const filePath = resolveRequestPath(request.url || "/");
  if (!filePath) {
    sendError(response, 403);
    return;
  }

  serveFile(request, response, filePath);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Broken Pines site listening on http://localhost:${port}`);
});
