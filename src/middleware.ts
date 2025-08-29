export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/repos",
    "/envs",
    "/api/env",
    "/api/env/:path*",
    "/api/github/:path*",
    "/api/share",
    "/api/repos",
  ],
};
