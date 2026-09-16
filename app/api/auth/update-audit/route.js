import { createUpdateAdminToken, isUpdateAdminAuthenticated, updateAdminCookieName } from "@/lib/update-admin-auth";

const getCookieHeader = () => {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
};

export async function GET(request) {
  return Response.json({ success: isUpdateAdminAuthenticated(request) });
}

export async function POST(request) {
  try {
    const { userId, password } = await request.json();
    const validUser = process.env.UPDATE_AUDIT_USER || "";
    const validPassword = process.env.UPDATE_AUDIT_PASSWORD || "";
    const success =
      Boolean(validUser && validPassword) &&
      userId === validUser &&
      password === validPassword;

    const headers = new Headers({ "Content-Type": "application/json" });
    if (success) {
      headers.append(
        "Set-Cookie",
        `${updateAdminCookieName}=${createUpdateAdminToken(userId)}; Max-Age=28800; ${getCookieHeader()}`,
      );
    }

    return new Response(JSON.stringify({ success }), { status: 200, headers });
  } catch {
    return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
