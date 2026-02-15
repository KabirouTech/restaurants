export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    created_at: string
                    subscription_plan: string | null
                    settings: Json | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    created_at?: string
                    subscription_plan?: string | null
                    settings?: Json | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    created_at?: string
                    subscription_plan?: string | null
                    settings?: Json | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    organization_id: string
                    full_name: string | null
                    role: 'admin' | 'staff' | 'driver' | null
                    avatar_url: string | null
                    created_at: string
                }
            }
            capacity_types: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    load_cost: number
                    color_code: string | null
                    created_at: string
                }
            }
            defaults_calendar: {
                Row: {
                    id: string
                    organization_id: string
                    day_of_week: number
                    max_daily_load: number
                    is_open: boolean
                }
            }
            calendar_overrides: {
                Row: {
                    id: string
                    organization_id: string
                    date: string
                    override_max_load: number | null
                    is_blocked: boolean
                    reason: string | null
                    created_at: string
                }
            }
            orders: {
                Row: {
                    id: string
                    organization_id: string
                    customer_id: string | null
                    conversation_id: string | null
                    capacity_type_id: string
                    status: 'draft' | 'pending_approval' | 'confirmed' | 'cancelled' | 'preparing' | 'delivered'
                    event_date: string
                    event_time: string | null
                    guest_count: number | null
                    total_amount_cents: number | null
                    deposit_paid_cents: number | null
                    delivery_address: Json | null
                    internal_notes: string | null
                    created_at: string
                    updated_at: string
                }
            }
            // Add other tables (customers, conversations, messages, products, etc.) as needed
        }
        Views: {
            daily_load_usage: {
                Row: {
                    organization_id: string
                    event_date: string
                    current_load: number
                }
            }
        }
        Functions: {
            check_availability: {
                Args: {
                    p_org_id: string
                    p_check_date: string
                    p_new_load_cost?: number
                }
                Returns: {
                    available: boolean
                    current_load: number
                    max_limit: number
                    remaining: number
                    reason?: string
                }
            }
        }
    }
}
