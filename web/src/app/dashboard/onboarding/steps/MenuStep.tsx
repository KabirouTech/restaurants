"use client";

import { ChefHat, Plus, Trash2, Utensils } from "lucide-react";

interface MenuItem {
    name: string;
    description: string;
    price: string;
    category: string;
}

interface MenuStepProps {
    menuItems: MenuItem[];
    onChange: (items: MenuItem[]) => void;
}

export function MenuStep({ menuItems, onChange }: MenuStepProps) {
    const addItem = () => {
        onChange([...menuItems, { name: "", description: "", price: "0", category: "Plat" }]);
    };

    const removeItem = (idx: number) => {
        onChange(menuItems.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, updates: Partial<MenuItem>) => {
        const updated = [...menuItems];
        updated[idx] = { ...updated[idx], ...updates };
        onChange(updated);
    };

    return (
        <div className="space-y-8">
            {/* Heading */}
            <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary border border-primary/20 mx-auto">
                    <ChefHat className="h-7 w-7" />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    Un aperçu de votre Menu ?
                </h2>
                <p className="text-muted-foreground">
                    Ajoutez quelques plats phares pour commencer votre catalogue
                </p>
            </div>

            {/* Menu items grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {menuItems.map((item, idx) => (
                    <div
                        key={idx}
                        className="relative group rounded-2xl p-5 bg-card shadow-sm hover:shadow-md border border-border transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <button
                            onClick={() => removeItem(idx)}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-card/80 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="space-y-3">
                            <input
                                value={item.name}
                                onChange={(e) => updateItem(idx, { name: e.target.value })}
                                className="font-bold text-lg w-full border-b border-transparent focus:border-border outline-none bg-transparent text-foreground"
                                placeholder="Nom du plat"
                            />
                            <textarea
                                value={item.description}
                                onChange={(e) => updateItem(idx, { description: e.target.value })}
                                className="text-sm text-muted-foreground w-full resize-none bg-transparent outline-none"
                                rows={2}
                                placeholder="Description..."
                            />
                            <div className="flex gap-2 items-center">
                                <span className="text-muted-foreground text-sm">Prix:</span>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateItem(idx, { price: e.target.value })}
                                    className="w-20 font-mono text-sm border rounded-lg px-2 py-1 bg-background"
                                />
                                <span className="text-sm text-muted-foreground">€</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add button */}
                <button
                    onClick={addItem}
                    className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[160px]"
                >
                    <Utensils className="h-8 w-8 mb-2" />
                    <span className="font-medium">Ajouter un Plat</span>
                </button>
            </div>
        </div>
    );
}
