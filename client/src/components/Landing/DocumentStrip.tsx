import { motion } from 'framer-motion';

const docs = ['ITP', 'RCA', 'CASCO', 'Rovinietă', 'Tahograf', 'Copie conformă', 'Licență', 'ADR', 'Atestat', 'Card tahograf'];

export default function DocumentStrip() {
    return (
        <section className="py-16 border-y-2 border-black bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-[10px] font-black text-black/40 mb-10 uppercase tracking-[0.4em]">Urmărim toate actele care contează în transport</p>
                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 md:gap-x-16 opacity-80">
                    {docs.map((label, i) => (
                        <motion.div key={label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                            {label}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
