import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    { q: 'Trebuie să montez ceva în camion?', a: 'Nu. FlotaLaZi nu e GPS. Introduci datele o dată, din telefon sau calculator, și primești alertele pe email.' },
    { q: 'Cum aflu că expiră un act?', a: 'În fiecare dimineață la 8 verificăm toate actele. Primești un email cu 30 de zile înainte (sau câte zile alegi), apoi cu 7 zile, cu o zi, în ziua expirării și a doua zi. Dacă actul rămâne expirat, îți amintim o dată pe săptămână până îl reînnoiești. Le vezi și în aplicație.' },
    { q: 'Pot urmări și actele șoferilor?', a: 'Da: permis, atestat profesional, card tahograf, avize medicale și psihologice — fiecare cu alertă proprie.' },
    { q: 'Am folosit aplicația „Flota Mea”. Pierd datele?', a: 'Nu. Faci backup din aplicația veche și îl încarci în Setări. Camioanele, actele și tranzacțiile se mută automat.' },
    { q: 'Remorcile se plătesc?', a: 'Nu. Plătești doar după numărul de camioane. Remorcile, șoferii și actele sunt nelimitate în orice plan.' },
    { q: 'Am o întrebare. Cu cine vorbesc?', a: 'Scrie-ne la contact@flotalazi.ro. Îți răspundem cât mai repede și te putem ajuta să-ți pui actele în aplicație.' },
    { q: 'Pot anula oricând?', a: 'Da, fără perioadă minimă și fără contract. Un camion rămâne gratuit pentru totdeauna.' },
];

export default function Faq() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section id="intrebari" className="py-20 md:py-24 bg-white">
            <div className="max-w-4xl mx-auto px-6 md:px-8">
                <h2 className="text-3xl md:text-5xl font-extrabold mb-12 text-center">Întrebări <span className="bg-[#465fff] text-white px-3 md:px-4">frecvente</span></h2>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={faq.q} className={`border-4 border-black transition-all ${openIndex === i ? 'bg-zinc-50 shadow-[4px_4px_0px_0px_#000]' : 'bg-white'}`}>
                            <button onClick={() => setOpenIndex(openIndex === i ? -1 : i)} aria-expanded={openIndex === i}
                                className="w-full p-5 md:p-6 flex justify-between items-center text-left gap-4">
                                <span className="text-base md:text-xl font-bold">{faq.q}</span>
                                {openIndex === i ? <Minus className="w-5 h-5 shrink-0" /> : <Plus className="w-5 h-5 shrink-0" />}
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                        <div className="p-5 md:p-6 pt-0 text-zinc-600 font-medium border-t-2 border-black/5">{faq.a}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
