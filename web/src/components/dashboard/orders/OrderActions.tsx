"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Mail, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { sendOrderEmailAction } from "@/actions/email";

export function OrderActions({ orderId, customerEmail }: { orderId: string, customerEmail?: string }) {
    const [email, setEmail] = useState(customerEmail || "");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSendEmail = async () => {
        if (!email) {
            toast.error("Veuillez entrer une adresse email");
            return;
        }

        setLoading(true);
        setLoading(true);
        try {
            const result = await sendOrderEmailAction(orderId, email, message); // Pass message
            if (result.error) {
                toast.error(result.error || "Erreur lors de l'envoi");
            } else {
                toast.success("Email envoyé avec succès !");
                setOpen(false);
                setMessage(""); // Reset message
            }
        } catch (error) {
            toast.error("Erreur inattendue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2 print:hidden">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Mail className="h-4 w-4" /> Envoyer par Email
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Envoyer la commande</DialogTitle>
                        <DialogDescription>
                            Entrez l'adresse email du destinataire.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="client@exemple.com"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="message" className="text-right pt-2">
                                Message
                            </Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="col-span-3"
                                placeholder="Un petit mot personnel (optionnel)..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSendEmail} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Envoyer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button className="bg-primary text-white gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimer / PDF
            </Button>
        </div>
    );
}
