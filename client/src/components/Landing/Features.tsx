import { motion } from 'framer-motion';
import { BellRing, FileText, Fuel, Users, Wallet, Upload } from 'lucide-react';

const features = [
    { icon: <FileText className="w-8 h-8" />, title: 'Toate actele, un loc', description: 'ITP, RCA, CASCO, rovinietă, tahograf, copie conformă, licență, ADR — pe fiecare camion și remorcă.' },
    { icon: <BellRing className="w-8 h-8" />, title: 'Alerte automate', description: 'Primești email cu 30, 7 și 1 zi înainte de expirare. Nu trebuie să-ți amintești tu.' },
    { icon: <Fuel className="w-8 h-8" />, title: 'Schimb de ulei', description: 'După kilometri și după luni. Vezi pe loc care camion intră în revizie.' },
    { icon: <Users className="w-8 h-8" />, title: 'Actele șoferilor', description: 'Permis, atestat, card tahograf, aviz medical și psihologic — cu alertă înainte să expire.' },
    { icon: <Wallet className="w-8 h-8" />, title: 'Profit pe camion', description: 'Încasări și cheltuieli în lei și euro, pe lună și pe categorii. Afli care camion îți aduce bani.' },
    { icon: <Upload className="w-8 h-8" />, title: 'Import din aplicația veche', description: 'Ai folosit aplicația „Flota Mea”? Îți importăm backup-ul cu un click.' },
];

export default function Features() {
    return (
        <section id="functii" className="py-32 relative bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-[2px] w-12 bg-[#465fff]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Funcții</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                        Tot ce ține de camion <br />
                        <span className="text-gray-400">fără caiet și fără Excel</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, i) => (
                        <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="p-10 border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white group">
                            <div className="mb-8 text-[#465fff] group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                            <h3 className="text-2xl font-bold tracking-tight mb-4">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed font-medium">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
