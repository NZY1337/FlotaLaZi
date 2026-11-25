import { BellRing, Check, Truck } from 'lucide-react';
import { IMAGES } from './images';

// Product facts, not marketing numbers: nothing here claims customers we don't have.
const facts = [
    { label: 'Tipuri de acte urmărite', value: '15+' },
    { label: 'Echipamente de montat', value: '0' },
    { label: 'Până la prima alertă', value: '10 min' },
];

export default function Core() {
    return (
        <section className="py-20 md:py-24 bg-black text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-12 border-b border-zinc-800 pb-16 md:pb-20">
                    {facts.map((s) => (
                        <div key={s.label} className="text-center md:text-left">
                            <h3 className="text-5xl md:text-6xl font-black text-[#7592ff] mb-2 tracking-tight">{s.value}</h3>
                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] md:text-sm">{s.label}</p>
                        </div>
                    ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-16 md:gap-20 items-center mt-16 md:mt-20">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 order-2 lg:order-1">
                        <div className="space-y-3 md:space-y-4">
                            <img src={IMAGES.convoy} className="w-full h-48 md:h-64 object-cover grayscale rounded-sm" alt="Camioane în coloană pe autostradă" referrerPolicy="no-referrer" />
                            <div className="bg-[#465fff] p-4 md:p-6 h-40 md:h-48 flex flex-col justify-end border-2 border-black">
                                <BellRing className="text-white w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-4" />
                                <h4 className="text-white font-black uppercase leading-none text-base md:text-xl">Alerte<br />din timp</h4>
                            </div>
                        </div>
                        <div className="space-y-3 md:space-y-4 pt-8 md:pt-12">
                            <div className="bg-zinc-900 p-4 md:p-6 h-40 md:h-48 flex flex-col justify-end border-2 border-zinc-700">
                                <Truck className="text-[#7592ff] w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-4" />
                                <h4 className="text-white font-black uppercase leading-none text-base md:text-xl">Profit pe<br />fiecare camion</h4>
                            </div>
                            <div className="bg-zinc-900 border-2 border-zinc-700 p-4 md:p-5 h-48 md:h-64 flex flex-col justify-center gap-3 font-mono text-[11px] md:text-xs">
                                <p className="text-zinc-500 uppercase tracking-widest">EuroTrack · azi 08:00</p>
                                <p className="text-white">⚠ ITP — NT 08 RGT: expiră în 7 zile</p>
                                <p className="text-white">⚠ Tahograf — NT 10 EUR: expiră în 20 zile</p>
                                <p className="text-white">🛢 Ulei — NT 08 RGT: mai sunt 3.500 km</p>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-8 leading-tight">Ca un secretar care nu uită nimic. Fără să-l plătești cu normă întreagă.</h2>
                        <p className="text-zinc-400 text-base md:text-lg mb-8 md:mb-10 leading-relaxed font-medium">
                            Un act uitat înseamnă amendă, camion tras pe dreapta sau cursă pierdută. EuroTrack ține evidența pentru tine și te anunță singur — nu trebuie să deschizi aplicația ca să afli că ceva expiră.
                        </p>
                        <ul className="space-y-4 md:space-y-6">
                            {['Acte pentru camioane, remorci, șoferi și firmă', 'Alerte zilnice pe email și în aplicație', 'Încasări și cheltuieli în lei și euro'].map((item) => (
                                <li key={item} className="flex items-center gap-3 md:gap-4 text-white font-bold uppercase tracking-tight text-xs md:text-sm">
                                    <div className="w-5 h-5 md:w-6 md:h-6 bg-[#465fff] flex items-center justify-center shrink-0"><Check className="text-white w-3 h-3 md:w-4 md:h-4" /></div>{item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
