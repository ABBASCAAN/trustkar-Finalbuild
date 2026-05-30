function stripHtmlTags(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTrackingMessage(html, cn) {
  // Remove scripts/styles
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Look for the query message pattern
  const queryMatch = clean.match(/Your query about\s*["']?([^"'>]+)["']?\s*appeared to be invalid[^<]*/i);
  if (queryMatch) {
    return queryMatch[0].trim();
  }

  // Look for record not found pattern
  const notFoundMatch = clean.match(/record not found[^<]*/i);
  if (notFoundMatch) {
    return `Your query about "${cn}" appeared to be invalid / record not found. Please enter a valid / correct consignment number or contact Leopards Courier for more details.`;
  }

  // Look for tracking table/details (successful tracking)
  const tableMatch = clean.match(/<table[\s\S]*?<\/table>/i);
  if (tableMatch) {
    return tableMatch[0];
  }

  // Fallback: extract meaningful body text
  const text = stripHtmlTags(clean);
  if (text.includes("invalid") || text.includes("not found")) {
    return `Your query about "${cn}" appeared to be invalid / record not found. Please enter a valid / correct consignment number or contact Leopards Courier for more details.`;
  }

  return text.slice(0, 500);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cn = searchParams.get("cn");
  if (!cn) {
    return new Response(JSON.stringify({ error: "Missing tracking number" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const res = await fetch(
      `https://pk.leopardscourier.com/shipment_tracking_view?cn_number=${encodeURIComponent(cn)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        cache: "no-store",
      }
    );
    const html = await res.text();
    const message = extractTrackingMessage(html, cn);
    const isHtml = message.includes("<");

    return new Response(
      JSON.stringify({ message, isHtml, cn }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch tracking info" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
