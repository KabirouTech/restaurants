'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface DefaultOrganization {
    id: string;
}

export function useOrganization() {
    const [organization, setOrganization] = useState<DefaultOrganization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const supabase = createClient();
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    setOrganization(null);
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile?.organization_id) {
                    setOrganization({ id: profile.organization_id });
                } else {
                    setOrganization(null);
                }
            } catch (error) {
                console.error('Error fetching organization:', error);
                setOrganization(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrg();
    }, []);

    return { organization, isLoading };
}
