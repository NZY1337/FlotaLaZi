import { motion } from 'framer-motion';
import { IMAGES } from './images';

const steps = [
    { number: '01', title: 'Adaugi camioanele', description: 'Număr de înmatriculare, remorca cuplată, kilometrajul. Durează un minut pe camion.' },
    { number: '02', title: 'Treci datele de expirare', description: 'ITP, RCA, rovinietă, tahograf, actele șoferilor. Sau imporți backup-ul din aplicația veche.' },
    { number: '03', title: 'Primești alertele', description: 'În fiecare dimineață verificăm tot și îți scriem doar când ceva se apropie de termen.' },
];

export default function HowItWorks() {
    return (
        <section id="cum-functioneaza" className="py-32 relative overflow-hidden bg-white border-t-2 border-black">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-[2px] w-12 bg-[#465fff]" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Cum funcționează</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-12">
                            Gata în <br />
                            <span className="text-gray-400">10 minute</span>
                        </h2>
                        <div className="space-y-12">
                            {steps.map((step, i) => (
                                <motion.div key={step.number} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.2 }}
                                    className="flex gap-8">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 bg-[#465fff] text-white flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_#000000]">{step.number}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold tracking-tight mb-3">{step.title}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative">
                        <div className="bg-black p-2 shadow-[8px_8px_0px_0px_#000000] transform rotate-2">
                            <div className="relative aspect-[4/5] overflow-hidden">
                                <img src={IMAGES.aerial} alt="Camion pe un drum prin pădure de toamnă, văzut de sus" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="absolute bottom-0 left-0 right-0 bg-[#465fff] p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="font-black text-white text-xl">Revizie ulei · NT 08 RGT</div>
                                        <div className="text-white font-black text-2xl">93%</div>
                                    </div>
                                    <div className="h-4 bg-white/20 overflow-hidden"><div className="h-full bg-white w-[93%]" /></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
