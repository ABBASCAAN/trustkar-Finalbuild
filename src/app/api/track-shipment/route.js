function removeScriptsAndStyles(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*stylesheet[^>]*>/gi, "");
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractResultHtml(html, cn) {
  const noScript = removeScriptsAndStyles(html);

  // --- ERROR CHECK ---
  const plainText = stripTags(noScript);
  if (plainText.includes("appeared to be invalid") || plainText.includes("record not found")) {
    return {
      type: "error",
      html: `Your query about "${cn}" appeared to be invalid / record not found. Please enter a valid / correct consignment number or contact Leopards Courier for more details.`,
    };
  }

  // --- EXTRACT TRACKING CONTENT ---
  let result = noScript;

  // Cut off everything before the first result-y section
  const markers = [
    "Consignment No",
    "Current Status",
    "Shipment Detail",
    "Shipper",
    "Consignee",
    "Origin",
    "Destination",
    "Out for Delivery",
    "Arrived",
    "Dispatched",
  ];
  let earliest = -1;
  for (const m of markers) {
    const idx = result.toLowerCase().indexOf(m.toLowerCase());
    if (idx > -1 && (earliest === -1 || idx < earliest)) earliest = idx;
  }
  if (earliest > 200) {
    result = result.slice(earliest - 100);
  }

  // Remove everything after common tail sections (footer links, social, etc.)
  const tailMarkers = ["Copyright", "All rights reserved", "Privacy Policy", "Contact Us"];
  for (const tm of tailMarkers) {
    const idx = result.toLowerCase().indexOf(tm.toLowerCase());
    if (idx > -1) result = result.slice(0, idx);
  }

  // Strip structural noise
  result = result
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  // Remove logo / brand images
  result = result
    .replace(/<img[^>]*logo[^>]*>/gi, "")
    .replace(/<img[^>]*leopard[^>]*>/gi, "");

  // Replace Leopards text
  result = result.replace(/Leopards Courier/gi, "Courier Partner");

  // Add base href so relative links work
  result = result.replace(
    /<head[^>]*>/i,
    '<head><base href="https://pk.leopardscourier.com/">'
  );

  return { type: "success", html: result };
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
