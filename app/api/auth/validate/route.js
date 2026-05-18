export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, password } = body || {};

    const validUser = process.env.DASHBOARD_USER || "";
    const validPass = process.env.DASHBOARD_PASSWORD || "";

    const success = userId === validUser && password === validPass;

    return new Response(JSON.stringify({ success }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
