"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="mt-6 inline-flex items-center gap-2 rounded px-2 py-1 text-sm border hover:bg-accent"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
