import { BellRing, Mail, TrendingUp } from 'lucide-react';
import { IMAGES } from './images';

// Static product shot for the hero: the truck photo behind, the app's dashboard
// on a phone in front, and the two things the owner gets without opening the
// app — the 08:00 email and the profit per truck. All drawn in code (sharp at
// any size, no image to load) with the landing's neo-brutalist style.

const alerts = [
    { dot: 'bg-red-500', tone: 'text-red-600', title: 'ITP', plate: 'NT 08 RGT', when: 'expiră mâine' },
    { dot: 'bg-amber-400', tone: 'text-amber-600', title: 'Asigurare RCA', plate: 'NT 83 SAT', when: 'în 12 zile' },
    { dot: 'bg-amber-400', tone: 'text-amber-600', title: 'Copie conformă', plate: 'Firmă', when: 'în 20 zile' },
    { dot: 'bg-emerald-500', tone: 'text-emerald-600', title: 'Tahograf', plate: 'NT 22 TIR', when: 'în 4 luni' },
];

const bars = [38, 52, 46, 64, 58, 80];

export default function HeroMockup() {
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
                            <BellRing className="h-4 w-4 text-black" />
                            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                        </div>
                    </div>

                    <div className="px-4 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Panou · azi</p>
                        <p className="mb-3 text-lg font-black leading-tight text-black">4 acte de urmărit</p>

                        <ul className="space-y-1.5">
                            {alerts.map((a) => (
                                <li key={a.title + a.plate} className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.dot}`} />
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
                                <div className="h-full w-[88%] rounded-full bg-amber-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The 08:00 email. */}
            <div className="relative z-20 -mt-6 ml-auto w-[85%] border-2 border-black bg-white p-3 shadow-[6px_6px_0px_0px_#000000] sm:absolute sm:right-0 sm:top-[16%] sm:mt-0 sm:w-[44%]">
                <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center bg-[#465fff]">
                        <Mail className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email · 08:00</span>
                </div>
                <p className="text-sm font-black leading-snug text-black">FlotaLaZi: ITP NT 08 RGT expiră mâine</p>
                <p className="mt-1 text-[11px] text-gray-500">Te anunțăm noi. Nu trebuie să deschizi aplicația.</p>
            </div>

            {/* Profit per truck. */}
            <div className="relative z-20 mt-4 mr-4 ml-auto w-[75%] border-2 border-black bg-black p-3 text-white shadow-[6px_6px_0px_0px_#465fff] sm:absolute sm:bottom-6 sm:right-0 sm:mt-0 sm:mr-0 sm:w-[44%]">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7592ff]">Profit · noiembrie</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-1 text-xl font-black">+18.450 lei</p>
                <p className="text-[10px] text-gray-400">NT 08 RGT · încasări − cheltuieli</p>
                <div className="mt-2 flex h-8 items-end gap-1">
                    {bars.map((h, i) => (
                        <div key={i} className={`flex-1 ${i === bars.length - 1 ? 'bg-[#465fff]' : 'bg-white/25'}`} style={{ height: `${h}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
