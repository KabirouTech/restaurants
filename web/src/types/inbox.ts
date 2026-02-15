export type ChannelPlatform = 'whatsapp' | 'instagram' | 'email' | 'messenger';

export interface Customer {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    tags?: string[];
    avatar_url?: string;
}

export interface Conversation {
    id: string;
    customer_id: string;
    channel_id: string;
    status: 'open' | 'snoozed' | 'closed';
    last_message_at: string;
    unread_count: number;
    customers?: Customer; // Joined
    channels?: {
        platform: ChannelPlatform;
    };
    snippet?: string; // Often computed or stored as last_message_content
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_type: 'customer' | 'agent' | 'system';
    content: string;
    created_at: string;
    read_at?: string;
    attachments?: any[];
}
