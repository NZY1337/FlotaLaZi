import { useEffect, useState } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { BellRing, Mail, TrendingUp } from 'lucide-react';
import { IMAGES } from './images';

// Static product shot for the hero: the truck photo behind, the app's dashboard
// on a phone in front, and the two things the owner gets without opening the
// app — the 08:00 email and the profit per truck. All drawn in code (sharp at
// any size, no image to load) with the landing's neo-brutalist style.
//
// Motion, once on load: the oil bar fills, the 08:00 email slides in, the
// profit counts up and its bars rise. Then only small loops: the bell rings,
// the red dot pulses and the profit bars breathe; the two cards stay put. People who ask their system for reduced
// motion get the final, still picture.

const alerts = [
    { dot: 'bg-red-500', tone: 'text-red-600', title: 'ITP', plate: 'NT 08 RGT', when: 'expiră mâine' },
    { dot: 'bg-amber-400', tone: 'text-amber-600', title: 'Asigurare RCA', plate: 'NT 83 SAT', when: 'în 12 zile' },
    { dot: 'bg-amber-400', tone: 'text-amber-600', title: 'Copie conformă', plate: 'Firmă', when: 'în 20 zile' },
    { dot: 'bg-emerald-500', tone: 'text-emerald-600', title: 'Tahograf', plate: 'NT 22 TIR', when: 'în 4 luni' },
];

const bars = [38, 52, 46, 64, 58, 80];
const PROFIT = 18_450;

/** Counts from 0 to `to` once, after `delay` seconds; shows `to` at once when motion is reduced. */
function useCountUp(to: number, delay: number, still: boolean) {
    const [value, setValue] = useState(still ? to : 0);
    useEffect(() => {
        if (still) { setValue(to); return; }
        const controls = animate(0, to, { duration: 1.4, delay, ease: 'easeOut', onUpdate: (v) => setValue(Math.round(v)) });
        return () => controls.stop();
    }, [to, delay, still]);
    return value;
}

export default function HeroMockup() {
    const still = !!useReducedMotion();
    const profit = useCountUp(PROFIT, 1.6, still);
    // `initial={false}` renders the end state straight away.
    const from = <T,>(start: T) => (still ? false : start);

    return (
        <div className="relative mx-auto w-full max-w-[540px] pt-6 sm:pt-10 sm:pb-6">
            {/* The truck photo, as before, now the backdrop. */}
            <div className="absolute right-0 top-0 w-[72%] -rotate-2 border-2 border-black bg-black p-1.5 shadow-[8px_8px_0px_0px_#000000]">
                <div className="aspect-[4/5] overflow-hidden">
                    <img src={IMAGES.hero} alt="Camion pe drum" className="h-full w-full object-cover contrast-110" referrerPolicy="no-referrer" />
                </div>
            </div>

            {/* Phone with the dashboard. */}
            <div className="relative z-10 ml-2 w-[78%] max-w-[280px] rounded-[2rem] sm:w-[52%] border-[3px] border-black bg-black p-2 shadow-[10px_10px_0px_0px_#465fff] sm:ml-6">
                <div className="overflow-hidden rounded-[1.6rem] bg-white">
                    <div className="flex items-center justify-between bg-white px-4 pt-3 pb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center bg-[#465fff] text-[11px] font-black text-white">F</div>
                            <span className="text-sm font-black tracking-tight text-black">FlotaLaZi</span>
                        </div>
                        <div className="relative">
                            {/* Rings: a short left-right swing, then a pause; about every 3 s. */}
                            <motion.div style={{ transformOrigin: '50% 10%' }}
                                animate={still ? undefined : { rotate: [0, -18, 16, -12, 8, -4, 0] }}
                                transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.2, delay: 1 }}>
                                <BellRing className="h-4 w-4 text-black" />
                            </motion.div>
                            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                        </div>
                    </div>

                    <div className="px-4 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Panou · azi</p>
                        <p className="mb-3 text-lg font-black leading-tight text-black">4 acte de urmărit</p>

                        <ul className="space-y-1.5">
                            {alerts.map((a) => (
                                <li key={a.title + a.plate} className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2">
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        {a.title === 'ITP' && !still && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${a.dot}`} />}
                                        <span className={`relative h-2.5 w-2.5 rounded-full ${a.dot}`} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[11px] font-bold text-black">{a.title}</p>
                                        <p className="truncate text-[10px] text-gray-500">{a.plate}</p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-bold ${a.tone}`}>{a.when}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-3 rounded-lg border border-gray-200 px-2.5 py-2">
                            <div className="mb-1 flex justify-between text-[10px]">
                                <span className="font-bold text-black">🛢️ Ulei · NT 22 TIR</span>
                                <span className="font-bold text-amber-600">mai sunt 3.000 km</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <motion.div className="h-full rounded-full bg-amber-400"
                                    initial={from({ width: '0%' })} animate={{ width: '88%' }} transition={{ duration: 1.2, delay: 0.9, ease: 'easeOut' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The 08:00 email. */}
            <motion.div className="relative z-20 -mt-6 ml-auto w-[85%] sm:absolute sm:right-0 sm:top-[16%] sm:mt-0 sm:w-[44%]"
                initial={from({ opacity: 0, x: 40 })} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1.2 }}>
            <motion.div className="border-2 border-black bg-white p-3 shadow-[6px_6px_0px_0px_#000000]">
                <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center bg-[#465fff]">
                        <Mail className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email · 08:00</span>
                </div>
                <p className="text-sm font-black leading-snug text-black">FlotaLaZi: ITP NT 08 RGT expiră mâine</p>
                <p className="mt-1 text-[11px] text-gray-500">Te anunțăm noi. Nu trebuie să deschizi aplicația.</p>
            </motion.div>
            </motion.div>

            {/* Profit per truck. */}
            <motion.div className="relative z-20 mt-4 mr-4 ml-auto w-[75%] sm:absolute sm:bottom-6 sm:right-0 sm:mt-0 sm:mr-0 sm:w-[44%]"
                initial={from({ opacity: 0, y: 30 })} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.5 }}>
            <motion.div className="border-2 border-black bg-black p-3 text-white shadow-[6px_6px_0px_0px_#465fff]">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7592ff]">Profit · noiembrie</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-1 text-xl font-black tabular-nums">+{profit.toLocaleString('ro-RO')} lei</p>
                <p className="text-[10px] text-gray-400">NT 08 RGT · încasări − cheltuieli</p>
                <div className="mt-2 flex h-8 items-end gap-1">
                    {bars.map((h, i) => {
                        const last = i === bars.length - 1;
                        // The column grows from the bottom once; inside it the bar
                        // keeps breathing between its height and a little above, each
                        // on its own rhythm. This month's (blue) bar reaches the top.
                        const peak = last ? 100 : Math.min(h + 14, 95);
                        return (
                            <motion.div key={i} className="flex h-full flex-1 items-end" style={{ transformOrigin: 'bottom' }}
                                initial={from({ scaleY: 0 })} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: 1.7 + i * 0.12, ease: 'easeOut' }}>
                                <motion.div className={`w-full ${last ? 'bg-[#465fff]' : 'bg-white/25'}`}
                                    style={{ height: `${h}%` }}
                                    animate={still ? undefined : { height: [`${h}%`, `${peak}%`] }}
                                    transition={{ duration: 1.6 + (i % 3) * 0.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror', delay: 2.4 + i * 0.2 }} />
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
            </motion.div>
        </div>
    );
}
