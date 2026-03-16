import { SignUp } from "@clerk/nextjs";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";

export default function SignUpPage() {
    const disableOAuth = process.env.NEXT_PUBLIC_DISABLE_CLERK_OAUTH === "true";

    return (
        <div className="flex min-h-screen">
            {/* Left: visual panel (hidden on mobile) */}
            <AuthSidePanel mode="sign-up" />

            {/* Right: Clerk form */}
            <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 lg:px-8">
                <div className="w-full max-w-md space-y-3">
                    <SignUp
                        forceRedirectUrl="/dashboard/onboarding"
                        appearance={
                            disableOAuth
                                ? {
                                    elements: {
                                        socialButtonsBlockButton: "hidden",
                                        dividerRow: "hidden",
                                        dividerLine: "hidden",
                                        dividerText: "hidden",
                                    },
                                }
                                : undefined
                        }
                    />
                    {disableOAuth && (
                        <p className="text-xs text-muted-foreground text-center">
                            Connexion sociale desactivee temporairement. Utilisez email + mot de passe.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
