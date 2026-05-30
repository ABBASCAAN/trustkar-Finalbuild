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
    let html = await res.text();
    const baseTag = '<base href="https://pk.leopardscourier.com/">';
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}`);
    } else if (html.includes("<html>")) {
      html = html.replace("<html>", `<html>${baseTag}`);
    }
    return new Response(JSON.stringify({ html, url: res.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed to fetch tracking info" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
