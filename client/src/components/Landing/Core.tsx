import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { BellRing, Check, Truck } from 'lucide-react';
import { IMAGES } from './images';

// "Ca un secretar…" section. Motion starts when the section scrolls into view,
// once: the facts count up, the text and the tiles slide in, the 08:00 digest
// lines arrive one by one. Then two small loops: the bell rings like the
// hero's and the truck idles. Reduced motion → the final, still picture.

// Product facts, not marketing numbers: nothing here claims customers we don't have.
const facts = [
    { label: 'Tipuri de acte urmărite', to: 15, suffix: '+' },
    { label: 'Echipamente de montat', to: 0, suffix: '' },
    { label: 'Până la prima alertă', to: 10, suffix: ' min' },
];

const points = ['Acte pentru camioane, remorci, șoferi și firmă', 'Alerte zilnice pe email și în aplicație', 'Încasări și cheltuieli în lei și euro'];

const digest = ['⚠ ITP — NT 08 RGT: expiră în 7 zile', '⚠ Tahograf — NT 10 EUR: expiră în 20 zile', '🛢 Ulei — NT 08 RGT: mai sunt 3.500 km'];

const ONCE = { once: true, amount: 0.3 } as const;

function CountUp({ to, suffix, delay, still }: { to: number; suffix: string; delay: number; still: boolean }) {
    const ref = useRef<HTMLHeadingElement>(null);
    const inView = useInView(ref, ONCE);
    const [value, setValue] = useState(still ? to : 0);
    useEffect(() => {
        if (still) { setValue(to); return; }
        if (!inView) return;
        const controls = animate(0, to, { duration: 1.2, delay, ease: 'easeOut', onUpdate: (v) => setValue(Math.round(v)) });
        return () => controls.stop();
    }, [inView, to, delay, still]);
    return <h3 ref={ref} className="text-5xl md:text-6xl font-black text-[#7592ff] mb-2 tracking-tight tabular-nums">{value}{suffix}</h3>;
}

export default function Core() {
    const still = !!useReducedMotion();
    // `initial={false}` renders the end state straight away.
    const from = <T,>(start: T) => (still ? false : start);
    const rise = (delay: number) => ({
        initial: from({ opacity: 0, y: 30 }),
        whileInView: { opacity: 1, y: 0 },
        viewport: ONCE,
        transition: { duration: 0.6, delay, ease: 'easeOut' as const },
    });

    return (
        <section className="py-20 md:py-24 bg-black text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-12 border-b border-zinc-800 pb-16 md:pb-20">
                    {facts.map((s, i) => (
                        <motion.div key={s.label} className="text-center md:text-left" {...rise(i * 0.15)}>
                            <CountUp to={s.to} suffix={s.suffix} delay={0.2 + i * 0.15} still={still} />
                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] md:text-sm">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-16 md:gap-20 items-center mt-16 md:mt-20">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 order-2 lg:order-1">
                        <div className="space-y-3 md:space-y-4">
                            <motion.div className="overflow-hidden rounded-sm" {...rise(0)}>
                                <motion.img
                                    src={IMAGES.convoy}
                                    className="w-full h-48 md:h-64 object-cover grayscale"
                                    alt="Camioane în coloană pe autostradă"
                                    referrerPolicy="no-referrer"
                                    initial={from({ scale: 1.15 })}
                                    whileInView={{ scale: 1 }}
                                    viewport={ONCE}
                                    transition={{ duration: 1.6, ease: 'easeOut' }}
                                />
                            </motion.div>
                            <motion.div className="bg-[#465fff] p-4 md:p-6 h-40 md:h-48 flex flex-col justify-end border-2 border-black" {...rise(0.15)}>
                                <motion.div
                                    className="w-fit mb-2 md:mb-4"
                                    style={{ transformOrigin: '50% 10%' }}
                                    animate={still ? undefined : { rotate: [0, -18, 16, -12, 8, -4, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.2, delay: 1 }}
                                >
                                    <BellRing className="text-white w-8 h-8 md:w-10 md:h-10" />
                                </motion.div>
                                <h4 className="text-white font-black uppercase leading-none text-base md:text-xl">Alerte<br />din timp</h4>
                            </motion.div>
                        </div>
                        <div className="space-y-3 md:space-y-4 pt-8 md:pt-12">
                            <motion.div className="bg-zinc-900 p-4 md:p-6 h-40 md:h-48 flex flex-col justify-end border-2 border-zinc-700" {...rise(0.3)}>
                                <motion.div
                                    className="w-fit mb-2 md:mb-4"
                                    animate={still ? undefined : { x: [0, 3, 0, 2, 0], y: [0, -1, 0, -1, 0] }}
                                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                                >
                                    <Truck className="text-[#7592ff] w-8 h-8 md:w-10 md:h-10" />
                                </motion.div>
                                <h4 className="text-white font-black uppercase leading-none text-base md:text-xl">Profit pe<br />fiecare camion</h4>
                            </motion.div>
                            <motion.div className="bg-zinc-900 border-2 border-zinc-700 p-4 md:p-5 h-48 md:h-64 flex flex-col justify-center gap-3 font-mono text-[11px] md:text-xs" {...rise(0.45)}>
                                <p className="text-zinc-500 uppercase tracking-widest">FlotaLaZi · azi 08:00</p>
                                {digest.map((line, i) => (
                                    <motion.p
                                        key={line}
                                        className="text-white"
                                        initial={from({ opacity: 0, x: -12 })}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={ONCE}
                                        transition={{ duration: 0.4, delay: 0.9 + i * 0.45 }}
                                    >
                                        {line}
                                    </motion.p>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <motion.h2 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-8 leading-tight" {...rise(0)}>
                            Ca un secretar care nu uită nimic. Fără să-l plătești cu normă întreagă.
                        </motion.h2>
                        <motion.p className="text-zinc-400 text-base md:text-lg mb-8 md:mb-10 leading-relaxed font-medium" {...rise(0.15)}>
                            Un act uitat înseamnă amendă, camion tras pe dreapta sau cursă pierdută. FlotaLaZi ține evidența pentru tine și te anunță singur — nu trebuie să deschizi aplicația ca să afli că ceva expiră.
                        </motion.p>
                        <ul className="space-y-4 md:space-y-6">
                            {points.map((item, i) => (
                                <motion.li
                                    key={item}
                                    className="flex items-center gap-3 md:gap-4 text-white font-bold uppercase tracking-tight text-xs md:text-sm"
                                    initial={from({ opacity: 0, x: 24 })}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={ONCE}
                                    transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                                >
                                    <motion.div
                                        className="w-5 h-5 md:w-6 md:h-6 bg-[#465fff] flex items-center justify-center shrink-0"
                                        initial={from({ scale: 0 })}
                                        whileInView={{ scale: 1 }}
                                        viewport={ONCE}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.45 + i * 0.15 }}
                                    >
                                        <Check className="text-white w-3 h-3 md:w-4 md:h-4" />
                                    </motion.div>
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
