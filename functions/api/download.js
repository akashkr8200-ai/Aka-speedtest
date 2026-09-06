export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const requested = Number(
    url.searchParams.get("bytes") || 25000000
  );

  const total = Math.min(
    Math.max(requested, 1024 * 1024),
    50 * 1024 * 1024
  );

  const chunkSize = 256 * 1024;
  let sent = 0;

  const chunk = new Uint8Array(chunkSize);
  crypto.getRandomValues(chunk);

  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= total) {
        controller.close();
        return;
      }

      const remaining = total - sent;

      const out =
        remaining >= chunkSize
          ? chunk
          : chunk.slice(0, remaining);

      controller.enqueue(out);
      sent += out.byteLength;
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(total),
      "cache-control": "no-store, no-cache, must-revalidate"
    }
  });
}
