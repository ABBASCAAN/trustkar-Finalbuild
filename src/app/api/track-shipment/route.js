function cleanHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*stylesheet[^>]*>/gi, "");
}

function hasValidTrackingData(html) {
  const h = html.toLowerCase();
  // Valid tracking pages have these markers
  const validMarkers = [
    "consignment no",
    "current status/reason",
    "shipment detail",
    "shipper",
    "consignee",
    "origin",
    "destination",
    "date",
    "status",
  ];
  let found = 0;
  for (const m of validMarkers) {
    if (h.includes(m)) found++;
  }
  // If we find at least 4 valid markers AND there are tables, it's likely valid
  const hasTables = /<table[\s\S]*?<\/table>/i.test(html);
  return found >= 4 && hasTables;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractResultHtml(html, cn) {
  const clean = cleanHtml(html);

  // --- FIRST: check if this is a valid tracking result ---
  if (hasValidTrackingData(clean)) {
    let result = clean;

    // Cut off everything before the first result section
    const markers = [
      "Consignment No",
      "Current Status",
      "Shipment Detail",
      "Shipper",
    ];
    let earliest = -1;
    for (const m of markers) {
      const idx = result.toLowerCase().indexOf(m.toLowerCase());
      if (idx > -1 && (earliest === -1 || idx < earliest)) earliest = idx;
    }
    if (earliest > 200) {
      result = result.slice(earliest - 100);
    }

    // Remove tail
    const tailMarkers = ["Copyright", "All rights reserved", "Privacy Policy", "Contact Us"];
    for (const tm of tailMarkers) {
      const idx = result.toLowerCase().indexOf(tm.toLowerCase());
      if (idx > -1) result = result.slice(0, idx);
    }

    // Strip noise
    result = result
      .replace(/<form[\s\S]*?<\/form>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "");

    // Remove branding
    result = result
      .replace(/<img[^>]*logo[^>]*>/gi, "")
      .replace(/<img[^>]*leopard[^>]*>/gi, "")
      .replace(/Leopards Courier/gi, "Courier Partner");

    // Add base href
    result = result.replace(
      /<head[^>]*>/i,
      '<head><base href="https://pk.leopardscourier.com/">'
    );

    return { type: "success", html: result };
  }

  // --- FALLBACK: error or not found ---
  const plainText = stripTags(clean);
  const isError =
    plainText.includes("appeared to be invalid") ||
    plainText.includes("record not found") ||
    plainText.includes("not found") ||
    !hasValidTrackingData(clean);

  if (isError) {
    return {
      type: "error",
      html: `Your query about "${cn}" appeared to be invalid / record not found. Please enter a valid / correct consignment number or contact Courier Partner for more details.`,
    };
  }

  // Unknown case — return what we got
  return { type: "success", html: clean };
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
    // Try POST first (mimics real form submission)
    const formData = new URLSearchParams();
    formData.append("cn_number", cn);

    const res = await fetch("https://pk.leopardscourier.com/shipment_tracking_view", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://pk.leopardscourier.com/tracking",
        Origin: "https://pk.leopardscourier.com",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    });
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
