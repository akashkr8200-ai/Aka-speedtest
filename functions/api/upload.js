export async function onRequestPost(context) {
  const reader = context.request.body?.getReader();
  let bytes = 0;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      bytes += value.byteLength;
    }
  }

  return Response.json({
    ok: true,
    bytes
  }, {
    headers: {
      "cache-control": "no-store"
    }
  });
}
