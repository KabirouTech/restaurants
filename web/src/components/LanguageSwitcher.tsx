'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setLocaleAction } from '@/actions/locale';
import { cn } from '@/lib/utils';

const LANGUAGES = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();
    const router = useRouter();

    // Show the language that is NOT currently active
    const other = LANGUAGES.find(l => l.code !== locale) ?? LANGUAGES[0];

    const toggle = async () => {
        await setLocaleAction(other.code);
        router.refresh();
    };

    return (
        <button
            onClick={toggle}
            title={`Passer en ${other.label}`}
            className={className ?? cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border',
                'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
            )}
        >
            <span className="text-sm">{other.flag}</span>
            <span>{other.code.toUpperCase()}</span>
        </button>
    );
}
