import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

// A plain HTML <form method="POST"> can submit straight here — no
// client-side JavaScript needed for something this simple.
export async function POST(request: Request) {
  await logout();
  return NextResponse.redirect(new URL("/login", request.url));
}
