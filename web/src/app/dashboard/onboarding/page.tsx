"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChefHat, Plus, Trash2, Utensils, Check, Calendar } from "lucide-react";
import { createOrganizationAction } from "@/actions/onboarding";
import { useRouter } from "next/navigation";

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        orgName: "",
        orgDescription: "",
        cuisineType: "",
        services: [
            { name: "Mariage", loadCost: 50, color: "#10b981" },
            { name: "Cocktail Dînatoire", loadCost: 10, color: "#f59e0b" }
        ],
        menuItems: [
            { name: "Thiéboudienne Royal", description: "Poisson frais, riz brisé, légumes du marché", price: "15", category: "Plat" },
        ]
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        const data = new FormData();
        data.append("fullName", formData.fullName);
        data.append("orgName", formData.orgName);
        data.append("orgDescription", formData.orgDescription);
        data.append("services", JSON.stringify(formData.services));
        data.append("menuItems", JSON.stringify(formData.menuItems));

        const res = await createOrganizationAction(data);
        if (res.error) {
            alert("Erreur: " + res.error);
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
                    <ChefHat className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold font-serif text-secondary">
                    {step === 1 && "Dites-nous tout, Chef."}
                    {step === 2 && "Quels services proposez-vous ?"}
                    {step === 3 && "Un aperçu de votre Menu ?"}
                    {step === 4 && "Prêt à démarrer !"}
                </h1>
                <p className="text-muted-foreground">
                    Étape {step} sur 4
                </p>
            </div>

            <div className="bg-white border border-border shadow-xl rounded-2xl overflow-hidden p-8 min-h-[400px]">

                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <div className="space-y-2">
                            <label className="font-medium">Votre Nom Complet</label>
                            <input
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Ex: Aminata Diallo"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="font-medium">Nom de votre Traiteur / Restaurant</label>
                            <input
                                value={formData.orgName}
                                onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Ex: Saveurs de Teranga"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="font-medium">Description Courte</label>
                            <textarea
                                value={formData.orgDescription}
                                onChange={e => setFormData({ ...formData, orgDescription: e.target.value })}
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none h-24"
                                placeholder="Spécialisé dans les événements traditionnels..."
                            />
                        </div>
                    </div>
                )}

                {/* STEP 2: SERVICES */}
                {step === 2 && (
                    <div className="space-y-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Définissez vos types d'événements et leur "Coût de Charge".<br />
                            Exemple : Un Mariage (50 pts) pèse autant que 5 Cocktails (10 pts).
                        </p>

                        <div className="space-y-3">
                            {formData.services.map((service, idx) => (
                                <div key={idx} className="flex gap-4 items-center p-4 border rounded-xl bg-muted/20">
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: service.color }}>
                                        {service.loadCost}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            value={service.name}
                                            onChange={e => {
                                                const newServices = [...formData.services];
                                                newServices[idx].name = e.target.value;
                                                setFormData({ ...formData, services: newServices });
                                            }}
                                            className="font-medium bg-transparent border-none outline-none w-full"
                                        />
                                    </div>
                                    <button onClick={() => {
                                        const newServices = formData.services.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, services: newServices });
                                    }} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setFormData({ ...formData, services: [...formData.services, { name: "Nouveau Service", loadCost: 10, color: "#6b7280" }] })}
                                className="flex items-center gap-2 text-primary font-medium hover:underline p-2"
                            >
                                <Plus className="h-4 w-4" /> Ajouter un service
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: MENU */}
                {step === 3 && (
                    <div className="space-y-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Ajoutez quelques plats phares pour commencer votre catalogue.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            {formData.menuItems.map((item, idx) => (
                                <Card key={idx} className="relative group">
                                    <button onClick={() => {
                                        const newItems = formData.menuItems.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, menuItems: newItems });
                                    }} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <CardContent className="p-4 space-y-3">
                                        <input
                                            value={item.name}
                                            onChange={e => {
                                                const newItems = [...formData.menuItems];
                                                newItems[idx].name = e.target.value;
                                                setFormData({ ...formData, menuItems: newItems });
                                            }}
                                            className="font-bold text-lg w-full border-b border-transparent focus:border-border outline-none bg-transparent" placeholder="Nom du plat"
                                        />
                                        <textarea
                                            value={item.description}
                                            onChange={e => {
                                                const newItems = [...formData.menuItems];
                                                newItems[idx].description = e.target.value;
                                                setFormData({ ...formData, menuItems: newItems });
                                            }}
                                            className="text-sm text-muted-foreground w-full resize-none bg-transparent outline-none" rows={2} placeholder="Description..."
                                        />
                                        <div className="flex gap-2">
                                            <span className="text-muted-foreground text-sm py-2">Prix:</span>
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={e => {
                                                    const newItems = [...formData.menuItems];
                                                    newItems[idx].price = e.target.value;
                                                    setFormData({ ...formData, menuItems: newItems });
                                                }}
                                                className="w-20 font-mono text-sm border rounded px-2"
                                            />
                                            <span className="text-sm py-2">€</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <button
                                onClick={() => setFormData({ ...formData, menuItems: [...formData.menuItems, { name: "", description: "", price: "0", category: "Plat" }] })}
                                className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors h-full min-h-[160px]"
                            >
                                <Utensils className="h-8 w-8 mb-2" />
                                <span className="font-medium">Ajouter un Plat</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: REVIEW */}
                {step === 4 && (
                    <div className="text-center py-8 space-y-6">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-bold font-serif text-secondary">Tout est prêt !</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Nous allons créer votre espace <strong>{formData.orgName}</strong> avec {formData.services.length} services et {formData.menuItems.length} plats au menu.
                        </p>
                        <div className="bg-muted/30 p-4 rounded-xl max-w-sm mx-auto text-left space-y-2 border border-border">
                            <p className="text-sm"><strong>Chef :</strong> {formData.fullName}</p>
                            <p className="text-sm"><strong>Cuisine :</strong> {formData.orgDescription || "Non spécifié"}</p>
                        </div>
                    </div>
                )}

            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                {step > 1 ? (
                    <Button variant="outline" onClick={handleBack} disabled={loading} className="px-8 border-primary/20 text-secondary">Précédent</Button>
                ) : <div></div>}

                {step < 4 ? (
                    <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full shadow-lg shadow-primary/20">
                        Suivant <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="bg-secondary hover:bg-secondary/90 text-white px-10 h-12 rounded-full text-lg shadow-xl shadow-secondary/20">
                        {loading ? "Création de votre cuisine..." : "Lancer mon Dashboard"}
                    </Button>
                )}
            </div>
        </div>
    );
}
