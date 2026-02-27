'use server';
import { cookies } from 'next/headers';

export async function setLocaleAction(locale: 'fr' | 'en') {
    const store = await cookies();
    store.set('NEXT_LOCALE', locale, { maxAge: 60 * 60 * 24 * 365, path: '/' });
}
