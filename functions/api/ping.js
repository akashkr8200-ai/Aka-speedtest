export async function onRequestGet() {
  return new Response("OK", {
    headers: {
      "content-type": "text/plain",
      "cache-control": "no-store"
    }
  });
}
