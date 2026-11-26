import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router';

// Launch prices, in lei — change them here (and in CLAUDE.md §10).
// Plans differ only in how many trucks they cover: every feature is in every
// plan, and trailers, drivers and documents are unlimited. The app does not
// enforce plans yet (no billing): this is the price list we sell with.
const plans = [
    {
        name: 'Gratuit',
        description: 'Pentru un singur camion',
        price: { monthly: '0', yearly: '0' },
        unit: { monthly: 'lei', yearly: 'lei' },
        cta: 'Începe gratuit',
        trucks: '1 camion, pentru totdeauna',
    },
    {
        name: 'Mic',
        description: 'Pentru firme cu 2–5 camioane',
        price: { monthly: '39', yearly: '390' },
        unit: { monthly: 'lei / lună', yearly: 'lei / an' },
        cta: 'Încearcă gratuit',
        trucks: 'Până la 5 camioane',
    },
    {
        name: 'Flotă',
        description: 'Pentru firme cu 6–10 camioane',
        price: { monthly: '79', yearly: '790' },
        unit: { monthly: 'lei / lună', yearly: 'lei / an' },
        popular: true,
        cta: 'Încearcă gratuit',
        trucks: 'Până la 10 camioane',
    },
    {
        name: 'Mare',
        description: 'Peste 10 camioane',
        price: { monthly: '149', yearly: '1.490' },
        unit: { monthly: 'lei / lună', yearly: 'lei / an' },
        cta: 'Încearcă gratuit',
        trucks: 'Camioane nelimitate',
        extra: 'Te ajutăm să introduci datele',
    },
];

// Same in every plan.
const included = ['Remorci, șoferi și acte nelimitate', 'Alerte zilnice pe email și în aplicație', 'Schimb de ulei după km și luni', 'Profit pe camion, în lei și euro'];

export default function Pricing() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="preturi" className="py-32 relative bg-white border-t-2 border-black">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-[2px] w-12 bg-[#465fff]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Prețuri</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-12">
                        Mai ieftin <br />
                        <span className="text-gray-400">decât o singură amendă</span>
                    </h2>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsYearly(false)}
                            className={`text-sm font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${!isYearly ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
                            Lunar
                        </button>
                        <button onClick={() => setIsYearly(true)}
                            className={`text-sm font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${isYearly ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
                            Anual <span className="text-white bg-[#465fff] px-2 py-0.5 ml-2">2 luni gratis</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {plans.map((plan, i) => (
                        <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`relative p-8 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all ${plan.popular ? 'bg-[#465fff]' : 'bg-white'}`}>
                            <h3 className={`text-3xl font-black tracking-tight mb-2 ${plan.popular ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
                            <p className={`text-sm font-bold mb-8 h-10 ${plan.popular ? 'text-white/70' : 'text-black/60'}`}>{plan.description}</p>
                            <div className="mb-10">
                                <span className={`text-5xl font-black ${plan.popular ? 'text-white' : 'text-black'}`}>{isYearly ? plan.price.yearly : plan.price.monthly}</span>
                                <span className={`text-base font-bold uppercase ${plan.popular ? 'text-white' : 'text-black'}`}> {isYearly ? plan.unit.yearly : plan.unit.monthly}</span>
                            </div>
                            <Link to="/signup"
                                className={`block text-center w-full py-5 font-black uppercase tracking-tight text-lg border-2 border-black shadow-[4px_4px_0px_0px_#000000] mb-10 transition-all ${plan.popular ? 'bg-white text-[#465fff] hover:bg-gray-50' : 'bg-black text-white hover:bg-[#465fff] hover:border-[#465fff]'}`}>
                                {plan.cta}
                            </Link>
                            <ul className="space-y-5">
                                {[plan.trucks, ...included, ...(plan.extra ? [plan.extra] : [])].map((feature) => (
                                    <li key={feature} className={`flex items-start gap-4 text-sm font-bold uppercase tracking-tight ${plan.popular ? 'text-white' : 'text-black'}`}>
                                        <Check className="w-5 h-5 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
