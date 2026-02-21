"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, User, Utensils, ChefHat, Rocket, Check, SkipForward } from "lucide-react";
import { createOrganizationAction } from "@/actions/onboarding";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { WelcomeStep } from "./steps/WelcomeStep";
import { IdentityStep } from "./steps/IdentityStep";
import { ServicesStep } from "./steps/ServicesStep";
import { MenuStep } from "./steps/MenuStep";
import { LaunchStep } from "./steps/LaunchStep";

const PROGRESS_STEPS = [
    { icon: User, label: "Identité" },
    { icon: Utensils, label: "Services" },
    { icon: ChefHat, label: "Menu" },
    { icon: Rocket, label: "Lancement" },
];

export default function OnboardingWizard() {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState<"forward" | "backward">("forward");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        orgName: "",
        orgDescription: "",
        currency: "XOF",
        primaryColor: "#f4af25",
        services: [
            { name: "Mariage", loadCost: 50, color: "#10b981" },
            { name: "Cocktail Dînatoire", loadCost: 10, color: "#f59e0b" },
        ],
        menuItems: [
            { name: "Thiéboudienne Royal", description: "Poisson frais, riz brisé, légumes du marché", price: "15", category: "Plat" },
        ],
        servicesSkipped: false,
        menuSkipped: false,
    });

    const goForward = useCallback(() => {
        setDirection("forward");
        setStep((s) => s + 1);
    }, []);

    const goBack = useCallback(() => {
        setDirection("backward");
        setStep((s) => {
            const next = s - 1;
            // Reset skip flags when going back to a skipped step
            if (next === 2) setFormData((f) => ({ ...f, servicesSkipped: false }));
            if (next === 3) setFormData((f) => ({ ...f, menuSkipped: false }));
            return next;
        });
    }, []);

    const skipStep = useCallback(() => {
        setDirection("forward");
        if (step === 2) {
            setFormData((f) => ({ ...f, servicesSkipped: true }));
        } else if (step === 3) {
            setFormData((f) => ({ ...f, menuSkipped: true }));
        }
        setStep((s) => s + 1);
    }, [step]);

    const handleSubmit = async () => {
        setLoading(true);
        const data = new FormData();
        data.append("fullName", formData.fullName);
        data.append("orgName", formData.orgName);
        data.append("orgDescription", formData.orgDescription);
        data.append("currency", formData.currency);
        data.append("primaryColor", formData.primaryColor);
        data.append("services", JSON.stringify(formData.services));
        data.append("menuItems", JSON.stringify(formData.menuItems));
        if (formData.servicesSkipped) data.append("servicesSkipped", "true");
        if (formData.menuSkipped) data.append("menuSkipped", "true");

        const res = await createOrganizationAction(data);
        if (res.error) {
            toast.error("Erreur lors de la création : " + res.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => router.push("/dashboard"), 2500);
        }
    };

    // Can proceed from step 1 only if identity fields are filled
    const canProceedFromIdentity = formData.fullName.trim() && formData.orgName.trim();

    // Slide animation class
    const slideClass = direction === "forward"
        ? "animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both"
        : "animate-in fade-in slide-in-from-left-8 duration-500 fill-mode-both";

    return (
        <div className="w-full max-w-4xl">
            {/* Progress bar — only for steps 1-4 */}
            {step >= 1 && (
                <div className="sticky top-0 z-20 backdrop-blur-md bg-background/80 rounded-2xl mb-8 p-4">
                    <div className="flex items-center justify-center gap-0">
                        {PROGRESS_STEPS.map((ps, idx) => {
                            const stepNum = idx + 1;
                            const isCompleted = step > stepNum;
                            const isCurrent = step === stepNum;
                            const Icon = isCompleted ? Check : ps.icon;

                            return (
                                <div key={idx} className="flex items-center">
                                    {/* Connector line */}
                                    {idx > 0 && (
                                        <div className="w-12 md:w-20 h-0.5 bg-muted relative mx-1">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 ease-out"
                                                style={{ width: step > idx ? "100%" : "0%" }}
                                            />
                                        </div>
                                    )}

                                    {/* Step circle */}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div
                                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                                isCompleted
                                                    ? "bg-primary text-white"
                                                    : isCurrent
                                                        ? "bg-primary/10 border-2 border-primary ring-4 ring-primary/10 text-primary"
                                                        : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            <Icon className="h-4.5 w-4.5" />
                                        </div>
                                        <span className={`text-xs font-medium hidden md:block ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                                            {ps.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step content with transitions */}
            <div key={step} className={slideClass}>
                <div className="bg-card border border-border shadow-xl rounded-2xl overflow-hidden p-6 md:p-8 min-h-[400px]">
                    {step === 0 && <WelcomeStep onNext={goForward} />}

                    {step === 1 && (
                        <IdentityStep
                            formData={formData}
                            onChange={(updates) => setFormData((f) => ({ ...f, ...updates }))}
                        />
                    )}

                    {step === 2 && (
                        <ServicesStep
                            services={formData.services}
                            onChange={(services) => setFormData((f) => ({ ...f, services }))}
                        />
                    )}

                    {step === 3 && (
                        <MenuStep
                            menuItems={formData.menuItems}
                            onChange={(menuItems) => setFormData((f) => ({ ...f, menuItems }))}
                        />
                    )}

                    {step === 4 && (
                        <LaunchStep
                            formData={formData}
                            loading={loading}
                            success={success}
                        />
                    )}
                </div>
            </div>

            {/* Navigation footer — not for welcome or after success */}
            {step >= 1 && !success && (
                <div className="flex items-center justify-between mt-8">
                    {/* Back */}
                    <Button
                        variant="outline"
                        onClick={goBack}
                        disabled={loading || step <= 1}
                        className={`px-6 border-primary/20 text-secondary rounded-full ${step <= 1 ? "invisible" : ""}`}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Précédent
                    </Button>

                    <div className="flex items-center gap-3">
                        {/* Skip button for steps 2 and 3 */}
                        {(step === 2 || step === 3) && (
                            <Button
                                variant="ghost"
                                onClick={skipStep}
                                disabled={loading}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <SkipForward className="mr-2 h-4 w-4" />
                                Passer cette étape
                            </Button>
                        )}

                        {/* Next / Submit */}
                        {step < 4 ? (
                            <Button
                                onClick={goForward}
                                disabled={step === 1 && !canProceedFromIdentity}
                                className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full shadow-lg shadow-primary/20"
                            >
                                Suivant
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-secondary hover:bg-secondary/90 text-white px-10 h-12 rounded-full text-lg shadow-xl shadow-secondary/20"
                            >
                                {loading ? "Création..." : "Lancer mon Dashboard"}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
