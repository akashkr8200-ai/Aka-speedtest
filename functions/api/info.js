export async function onRequestGet(context) {
  const request = context.request;
  const cf = request.cf || {};

  const ip = request.headers.get("CF-Connecting-IP") || "";

  return Response.json({
    ip,
    city: cf.city || "",
    country: cf.country || "",
    network: cf.asOrganization || ""
  }, {
    headers: {
      "cache-control": "no-store"
    }
  });
}
