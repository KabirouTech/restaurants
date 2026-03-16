'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface DefaultOrganization {
    id: string;
}

export function useOrganization() {
    const { userId } = useAuth();
    const [organization, setOrganization] = useState<DefaultOrganization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrg = async () => {
            if (!userId) {
                setOrganization(null);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/me/organization', { cache: 'no-store' });
                if (!res.ok) {
                    setOrganization(null);
                    return;
                }

                const data = await res.json();
                if (data?.organizationId) {
                    setOrganization({ id: data.organizationId });
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
    }, [userId]);

    return { organization, isLoading };
}
