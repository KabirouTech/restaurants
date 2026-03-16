import { redirect } from "next/navigation";

// Legacy route — Clerk handles sign-out via SignOutButton.
// Redirect to home if someone hits this directly.
export async function POST() {
    return redirect("/");
}
