function cleanLeopardsHtml(html) {
  // Remove scripts, styles, nav, header, footer elements
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/class="[^"]*header[^"]*"/gi, "")
    .replace(/class="[^"]*navbar[^"]*"/gi, "")
    .replace(/class="[^"]*footer[^"]*"/gi, "");
}

function extractResultHtml(html, cn) {
  let clean = cleanLeopardsHtml(html);

  // Check for error message
  const textContent = clean.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  if (textContent.includes("appeared to be invalid") || textContent.includes("record not found")) {
    return {
      type: "error",
      html: `Your query about "${cn}" appeared to be invalid / record not found. Please enter a valid / correct consignment number or contact Leopards Courier for more details.`,
    };
  }

  // Find the tracking result section - usually after search form
  // Try to extract from body content area
  let resultHtml = clean;

  // Remove everything before the first table or result section
  const tableIndex = resultHtml.toLowerCase().indexOf("<table");
  if (tableIndex > -1) {
    // Try to find content before the table that might contain status info
    const beforeTable = resultHtml.slice(0, tableIndex);
    // Look for consignment info before table
    const consignMatch = beforeTable.match(/consignment\s*no[^<]*/i);
    if (consignMatch) {
      resultHtml = resultHtml.slice(tableIndex - 200);
    }
  }

  // Remove obvious Leopards branding elements
  resultHtml = resultHtml
    .replace(/<img[^>]*logo[^>]*>/gi, "")
    .replace(/<img[^>]*leopard[^>]*>/gi, "")
    .replace(/Leopards Courier/gi, "Courier Partner");

  return { type: "success", html: resultHtml };
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
    const result = extractResultHtml(html, cn);

    return new Response(
      JSON.stringify({
        type: result.type,
        html: result.html,
        cn,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch tracking info" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
