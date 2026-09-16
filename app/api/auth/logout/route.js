import { updateAdminCookieName } from "@/lib/update-admin-auth";

const authCookieName = "dashboardAuth";

export async function POST() {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    `${authCookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
  );
  headers.append(
    "Set-Cookie",
    `${updateAdminCookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}
