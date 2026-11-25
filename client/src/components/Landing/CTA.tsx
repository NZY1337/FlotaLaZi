import { motion } from 'framer-motion';
import { Link } from 'react-router';

export default function CTA() {
    return (
        <section className="py-32 relative px-6 bg-black text-white">
            <div className="max-w-5xl mx-auto text-center">
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                    <h2 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-10 leading-tight">
                        Lasă-ne pe noi <br />
                        <span className="text-[#7592ff]">să ținem minte termenele.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto font-medium">
                        Adaugă primele camioane în 10 minute. Primele 2 sunt gratuite, pentru totdeauna.
                    </p>
                    <Link to="/signup" className="inline-block bg-[#465fff] text-white px-12 py-6 font-black uppercase tracking-tight text-2xl shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] transition-all">
                        Începe gratuit
                    </Link>
                    <p className="mt-8 text-xs font-bold uppercase tracking-widest text-white/30">Fără card. Fără GPS. Fără contract.</p>
                </motion.div>
            </div>
        </section>
    );
}
