import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground p-8">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive animate-pulse">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-bold font-serif text-secondary">Oups !</h1>
                <p className="text-muted-foreground text-lg">
                    Une erreur est survenue lors de l'authentification.
                </p>
                <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground font-mono mb-4 text-left overflow-auto max-h-40">
                    <p>Code d'erreur : auth-code-error</p>
                    <p>Veuillez réessayer ou contacter le support si le problème persiste.</p>
                </div>

                <div className="space-y-3 pt-4">
                    <Link href="/auth/login" className="block w-full">
                        <Button className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-white font-medium">Retour à la connexion</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
