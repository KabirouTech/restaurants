'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setLocaleAction } from '@/actions/locale';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();
    const router = useRouter();
    const current = LANGUAGES.find(l => l.code === locale) ?? LANGUAGES[0];

    const switchTo = async (code: typeof LANGUAGES[number]['code']) => {
        if (code === locale) return;
        await setLocaleAction(code);
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={className ?? cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border',
                        'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                    )}
                >
                    <span className="text-sm">{current.flag}</span>
                    <span>{current.code.toUpperCase()}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
                {LANGUAGES.map(lang => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => switchTo(lang.code)}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <span className="text-sm">{lang.flag}</span>
                        <span className="flex-1">{lang.label}</span>
                        {lang.code === locale && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
