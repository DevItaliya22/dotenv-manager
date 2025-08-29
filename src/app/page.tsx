import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import LoginForm from "./login-form";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/repos");
  }
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-lg border p-6 shadow-sm bg-background">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">
              Sign in to Dotenv Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage, share, and download .env for your repos.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <a
              href="/api/auth/signin/github?callbackUrl=/repos"
              className="w-full inline-flex justify-center items-center border px-4 py-2 rounded"
            >
              Continue with GitHub
            </a>
            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
