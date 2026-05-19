const authCookieName = "dashboardAuth";
const getCookieHeader = () => {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
};

export async function GET(req) {
  const cookieValue = req.cookies.get(authCookieName)?.value;
  const success = cookieValue === "true";

  return new Response(JSON.stringify({ success }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, password } = body || {};

    const validUser = process.env.DASHBOARD_USER || "";
    const validPass = process.env.DASHBOARD_PASSWORD || "";

    const success = userId === validUser && password === validPass;
    const headers = { "Content-Type": "application/json" };

    if (success) {
      headers["Set-Cookie"] = `${authCookieName}=true; ${getCookieHeader()}`;
    }

    return new Response(JSON.stringify({ success }), {
      status: 200,
      headers,
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
