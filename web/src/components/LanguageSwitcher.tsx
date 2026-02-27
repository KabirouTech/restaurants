'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { setLocaleAction } from '@/actions/locale';
import { cn } from '@/lib/utils';

const LANGUAGES = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const select = async (code: 'fr' | 'en') => {
        setOpen(false);
        await setLocaleAction(code);
        router.refresh();
    };

    const current = LANGUAGES.find(l => l.code === locale) ?? LANGUAGES[0];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={className ?? cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border',
                    'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                )}
            >
                <span>{current.flag}</span>
                <span>{current.code.toUpperCase()}</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform duration-150', open && 'rotate-180')} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-38 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-[100]">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => select(lang.code)}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors',
                                lang.code === locale
                                    ? 'bg-primary/5 text-primary font-semibold'
                                    : 'text-foreground hover:bg-muted'
                            )}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span className="flex-1">{lang.label}</span>
                            {lang.code === locale && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
