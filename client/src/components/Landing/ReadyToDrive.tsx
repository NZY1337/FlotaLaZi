import { useRef, useState } from 'react';
import { type MotionValue, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Check } from 'lucide-react';

// "Gata de drum": right under the hero, a truck crosses the page as you scroll,
// passing the ITP / RCA / Rovinietă signs, which turn green as it goes by.
// The drive is tied to scrolling, not to time (scroll back and it backs up).
// Reduced motion → the end of the drive: truck at the right, every sign green.

// Where each sign stands on the road, in % of its width.
const SIGNS = [
    { label: 'ITP', at: 22 },
    { label: 'RCA', at: 52 },
    { label: 'Rovinietă', at: 82 },
];

// The truck drives on a track as wide as the road minus the truck, so at 100%
// it ends flush with the road's right edge on any screen. It starts at START
// of that track (partly off the road, on the left). The truck is TRUCK of the
// road on a computer (a bit more on a phone, where a sign turns green a touch
// late); its front reaches a sign standing at `at` % of the road at:
const START = -0.4;
const TRUCK = 0.24;
const passedAt = (at: number) => ((at / 100 - TRUCK) / (1 - TRUCK) - START) / (1 - START);

export default function ReadyToDrive() {
    const still = !!useReducedMotion();
    const scene = useRef<HTMLDivElement>(null);
    // 0 when the road scene comes up from the bottom of the screen, 1 when it
    // has reached the middle: the whole drive happens in plain view, below the
    // fixed navbar.
    const { scrollYProgress } = useScroll({ target: scene, offset: ['start 0.95', 'end 0.55'] });
    const left = useTransform(scrollYProgress, [0, 1], [`${START * 100}%`, '100%']);
    const wheels = useTransform(scrollYProgress, [0, 1], [0, 1080]);
    const finale = useTransform(scrollYProgress, [0.82, 0.95], [0, 1]);

    const [passed, setPassed] = useState(still ? SIGNS.length : 0);
    useMotionValueEvent(scrollYProgress, 'change', (p) => {
        if (!still) setPassed(SIGNS.filter((s) => p >= passedAt(s.at)).length);
    });

    return (
        <section aria-label="Gata de drum" className="py-20 md:py-28 bg-white border-t-2 border-black overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[2px] w-12 bg-[#465fff]" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Cu actele la zi</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1] mb-12 md:mb-16">
                    Pleci la drum <span className="bg-[#465fff] text-white px-3 inline-block">fără griji.</span>
                </h2>

                <div ref={scene} className="relative h-60 md:h-72" aria-hidden="true">
                    {SIGNS.map((s, i) => {
                        const ok = i < passed;
                        return (
                            <div key={s.label} className="absolute bottom-20 md:bottom-24 -translate-x-1/2 flex flex-col items-center" style={{ left: `${s.at}%` }}>
                                <motion.div
                                    animate={{ scale: ok && !still ? [1, 1.15, 1] : 1 }}
                                    transition={{ duration: 0.35 }}
                                    className={`border-[3px] md:border-4 border-black px-1.5 md:px-3 py-1 md:py-2 font-black uppercase text-[10px] md:text-base whitespace-nowrap flex items-center gap-1 md:gap-1.5 transition-colors duration-300 ${ok ? 'bg-[#22c55e] text-black' : 'bg-white text-black/40'}`}>
                                    {ok ? <Check className="w-3 h-3 md:w-5 md:h-5" strokeWidth={4} /> : <span>?</span>}
                                    {s.label}
                                </motion.div>
                                <div className="w-1.5 h-20 md:h-28 bg-black" />
                            </div>
                        );
                    })}

                    {/* The road: asphalt with a dashed middle line. */}
                    <div className="absolute inset-x-0 bottom-0 h-20 md:h-24 bg-zinc-900 border-y-4 border-black">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5"
                            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0 32px, transparent 32px 64px)' }} />
                    </div>

                    {/* The track: the road minus the truck's width (34% on a phone, 24% on a computer). */}
                    <div className="absolute inset-y-0 left-0 right-[34%] md:right-[24%] z-10">
                        <motion.div className="absolute bottom-8 md:bottom-10 w-[51.5%] md:w-[31.6%]" style={{ left: still ? '100%' : left }}>
                            <TruckDrawing wheels={still ? 0 : wheels} />
                        </motion.div>
                    </div>
                </div>

                <motion.p style={{ opacity: still ? 1 : finale }}
                    className="mt-8 md:mt-10 text-right text-xl md:text-4xl font-black tracking-tight">
                    Gata de drum. <span className="text-[#465fff]">Toate actele la zi.</span>
                </motion.p>
            </div>
        </section>
    );
}

type Wheels = number | MotionValue<number>;

function Wheel({ cx, rotate }: { cx: number; rotate: Wheels }) {
    return (
        <motion.g style={{ rotate, transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={cx} cy={92} r={13} fill="#111" stroke="#000" strokeWidth={3} />
            <circle cx={cx} cy={92} r={5} fill="#d4d4d8" />
            <rect x={cx - 1.5} y={80} width={3} height={8} fill="#d4d4d8" />
        </motion.g>
    );
}

// A tractor unit with a semi-trailer, side view, facing right. Flat colours and
// thick black outlines, like the rest of the page.
function TruckDrawing({ wheels }: { wheels: Wheels }) {
    return (
        <svg viewBox="0 0 260 110" className="w-full h-auto drop-shadow-[6px_6px_0_rgba(0,0,0,1)]">
            {/* Semi-trailer */}
            <rect x={4} y={8} width={170} height={70} fill="#fff" stroke="#000" strokeWidth={4} />
            <rect x={4} y={8} width={170} height={12} fill="#465fff" stroke="#000" strokeWidth={4} />
            <text x={89} y={58} textAnchor="middle" fontSize={22} fontWeight={900} fontFamily="inherit" fill="#000" letterSpacing={-1}>FlotaLaZi</text>
                        {/* Tractor */}
            <path d="M182 84 V36 Q182 26 192 26 H226 Q236 26 242 40 L252 60 V84 Z" fill="#465fff" stroke="#000" strokeWidth={4} strokeLinejoin="round" />
            <path d="M216 33 H227 Q232 33 236 41 L242 54 H216 Z" fill="#c7d2fe" stroke="#000" strokeWidth={3} strokeLinejoin="round" />
            <rect x={246} y={64} width={8} height={6} fill="#facc15" stroke="#000" strokeWidth={2} />
            <rect x={4} y={84} width={250} height={4} fill="#000" />
            <Wheel cx={36} rotate={wheels} />
            <Wheel cx={66} rotate={wheels} />
            <Wheel cx={198} rotate={wheels} />
            <Wheel cx={226} rotate={wheels} />
        </svg>
    );
}
