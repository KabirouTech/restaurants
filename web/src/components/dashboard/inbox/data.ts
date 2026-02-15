// Inbox data mock
export type Conversation = {
    id: string;
    clientName: string;
    platform: "whatsapp" | "instagram";
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    messages: Message[];
};

export type Message = {
    id: string;
    sender: "client" | "me";
    text: string;
    timestamp: string;
};

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: "1",
        clientName: "Sophie Martin",
        platform: "whatsapp",
        lastMessage: "Est-ce que le menu végétarien est inclus ?",
        timestamp: "10:30",
        unreadCount: 1,
        messages: [
            { id: "m1", sender: "me", text: "Bonjour Sophie, merci pour votre commande pour le 10 Mars.", timestamp: "10:00" },
            { id: "m2", sender: "client", text: "Bonjour ! J'avais une petite question.", timestamp: "10:15" },
            { id: "m3", sender: "client", text: "Est-ce que le menu végétarien est inclus ?", timestamp: "10:30" },
        ]
    },
    {
        id: "2",
        clientName: "Jean Dupont",
        platform: "instagram",
        lastMessage: "Super, merci beaucoup !",
        timestamp: "Hier",
        unreadCount: 0,
        messages: [
            { id: "m1", sender: "client", text: "Salut, vous faites des livraisons sur Dakar-Plateau ?", timestamp: "Hier 14:00" },
            { id: "m2", sender: "me", text: "Oui tout à fait, à partir de 50.000 FCFA de commande.", timestamp: "Hier 14:30" },
            { id: "m3", sender: "client", text: "Super, merci beaucoup !", timestamp: "Hier 14:45" },
        ]
    },
    {
        id: "3",
        clientName: "Alice Henry",
        platform: "whatsapp",
        lastMessage: "Je vous envoie le virement ce soir.",
        timestamp: "Lun",
        unreadCount: 0,
        messages: [
            { id: "m1", sender: "me", text: "Voici le devis pour les 3 plateaux repas.", timestamp: "Lun 09:00" },
            { id: "m2", sender: "client", text: "Je vous envoie le virement ce soir.", timestamp: "Lun 18:00" },
        ]
    },
];
