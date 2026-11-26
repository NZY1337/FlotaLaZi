import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router';
import { X } from 'lucide-react';

// Moving strip above the landing's header that announces /masina. Yellow on
// purpose: it has to stand out from the site's blue. Closing it
// is remembered in this browser; it never shows on /masina itself. Reduced
// motion = the same text, still.

const DISMISSED_KEY = 'flotalazi.promo.masina';

function wasDismissed() {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
}

function Item() {
    return (
        <span className="flex shrink-0 items-center gap-3 px-8">
            <span className="bg-black px-2 py-0.5 text-[10px] font-black text-[#FFD60A]">NOU</span>
            Acum și pentru mașina personală: alerte gratuite pentru ITP, RCA și rovinietă
            <span aria-hidden>→</span>
        </span>
    );
}

export default function PromoBanner() {
    const { pathname } = useLocation();
    const still = !!useReducedMotion();
    const [hidden, setHidden] = useState(wasDismissed);
    if (hidden || pathname === '/masina') return null;

    const dismiss = () => {
        setHidden(true);
        try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* private mode: just hide it for now */ }
    };

    return (
        <div className="relative flex h-10 items-center overflow-hidden border-b-2 border-black bg-[#FFD60A] text-[11px] font-bold uppercase tracking-wide text-black sm:text-xs">
            <Link to="/masina" className="absolute inset-0 z-10" aria-label="Nou: alerte gratuite pentru mașina personală. Află mai multe." />
            {still ? (
                <div className="mx-auto pr-10" aria-hidden><Item /></div>
            ) : (
                // Two identical halves: moving by -50% lands exactly where it started.
                <motion.div className="flex w-max" aria-hidden animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 40, ease: 'linear', repeat: Infinity }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Item key={i} />)}
                </motion.div>
            )}
            <button type="button" onClick={dismiss} aria-label="Închide anunțul"
                className="absolute right-0 z-20 flex h-full items-center border-l-2 border-black bg-[#FFD60A] px-3 hover:bg-[#f0c800]">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
