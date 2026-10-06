/**
 * Resolve the requester IP on the server. The browser can never set the
 * stored value through the request body.
 *
 * Deployment note: forwarding headers are only trustworthy behind a proxy
 * that overwrites or appends them (Vercel, nginx, a cloud load balancer).
 * We prefer X-Real-IP, then the LAST X-Forwarded-For entry (the address the
 * nearest trusted proxy observed), never the first (client-controlled).
 * If you self-host, make sure your reverse proxy sets X-Real-IP.
 */
const IP_SHAPE = /^[0-9a-fA-F:.]{3,45}$/;

export function getClientIp(request) {
  const headers = request.headers;
  const realIp = headers.get("x-real-ip")?.trim();
  const forwarded = headers.get("x-forwarded-for");
  const lastForwarded = forwarded ? forwarded.split(",").pop().trim() : "";

  const candidate = realIp || lastForwarded;
  return candidate && IP_SHAPE.test(candidate) ? candidate : "unknown";
}
