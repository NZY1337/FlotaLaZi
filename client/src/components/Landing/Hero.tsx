import { motion } from 'framer-motion';
import { Link } from 'react-router';
import HeroMockup from './HeroMockup';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-28 pb-16 lg:pt-20 overflow-hidden bg-white">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-gray-100 pointer-events-none select-none uppercase">FLOTA</div>
            <div className="absolute top-[15%] right-[35%] w-32 h-32 bg-[#465fff]/20 -z-10" />

            <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="max-w-2xl">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                            className="flex items-center gap-3 mb-6">
                            <div className="h-[2px] w-12 bg-[#465fff]" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Pentru firme de transport</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-black leading-[1] tracking-tight mb-8">
                            Niciun act <br className="hidden sm:block" />
                            expirat. <br className="hidden sm:block" />
                            <span className="bg-[#465fff] text-white px-4 py-2 inline-block mt-2 sm:mt-0">Nicio amendă.</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-500 text-lg md:text-xl mb-12 max-w-lg leading-relaxed">
                            ITP, RCA, rovinietă, tahograf, copie conformă, actele șoferilor și schimbul de ulei — pentru fiecare camion și remorcă.
                            Te anunțăm din timp, iar tu vezi și cât câștigă fiecare camion.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-wrap items-center gap-6">
                            <Link to="/signup" className="bg-[#465fff] text-white px-10 py-5 font-black uppercase tracking-tight text-lg shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                                Începe gratuit
                            </Link>
                            <a href="#cum-functioneaza" className="flex items-center gap-3 px-10 py-5 border-2 border-black font-black uppercase tracking-tight text-lg hover:bg-[#465fff] hover:border-[#465fff] hover:text-white transition-all">
                                Cum funcționează
                            </a>
                        </motion.div>
                        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">Un camion gratuit · fără card · fără GPS de montat</p>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
                        <HeroMockup />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
