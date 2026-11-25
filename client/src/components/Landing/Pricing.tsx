import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router';

// Launch prices — change them here.
const plans = [
    {
        name: 'Start',
        description: 'Pentru cine are 1–2 camioane',
        price: { monthly: '0', yearly: '0' },
        unit: '€ / lună',
        cta: 'Începe gratuit',
        features: ['Până la 2 camioane + remorci', 'Toate tipurile de acte', 'Alerte pe email', 'Schimb de ulei după km și luni'],
    },
    {
        name: 'Flotă',
        description: 'Pentru firme cu 3–10 camioane',
        price: { monthly: '7', yearly: '5,6' },
        unit: '€ / camion / lună',
        popular: true,
        cta: 'Încearcă gratuit',
        features: ['Camioane nelimitate', 'Actele șoferilor', 'Profit pe camion, lei + euro', 'Export pentru contabil', 'Import din aplicația veche'],
    },
    {
        name: 'Firmă',
        description: 'Peste 10 camioane',
        price: { monthly: 'Ofertă', yearly: 'Ofertă' },
        unit: '',
        cta: 'Contactează-ne',
        features: ['Tot ce include Flotă', 'Ajutor la introducerea datelor', 'Suport prioritar', 'Alerte pe WhatsApp (în curând)'],
    },
];

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
                            Anual <span className="text-white bg-[#465fff] px-2 py-0.5 ml-2">-20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {plans.map((plan, i) => (
                        <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`relative p-10 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all ${plan.popular ? 'bg-[#465fff]' : 'bg-white'}`}>
                            <h3 className={`text-3xl font-black tracking-tight mb-2 ${plan.popular ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
                            <p className={`text-sm font-bold mb-8 h-10 ${plan.popular ? 'text-white/70' : 'text-black/60'}`}>{plan.description}</p>
                            <div className="mb-10">
                                <span className={`text-6xl font-black ${plan.popular ? 'text-white' : 'text-black'}`}>{isYearly ? plan.price.yearly : plan.price.monthly}</span>
                                {plan.unit && <span className={`text-base font-bold uppercase ${plan.popular ? 'text-white' : 'text-black'}`}> {plan.unit}</span>}
                            </div>
                            <Link to="/signup"
                                className={`block text-center w-full py-5 font-black uppercase tracking-tight text-lg border-2 border-black shadow-[4px_4px_0px_0px_#000000] mb-10 transition-all ${plan.popular ? 'bg-white text-[#465fff] hover:bg-gray-50' : 'bg-black text-white hover:bg-[#465fff] hover:border-[#465fff]'}`}>
                                {plan.cta}
                            </Link>
                            <ul className="space-y-5">
                                {plan.features.map((feature) => (
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
