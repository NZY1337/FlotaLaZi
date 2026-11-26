import { motion, useReducedMotion } from 'framer-motion';
import { BellRing, Check, Mail } from 'lucide-react';
import { Link } from 'react-router';
import PageMeta from '../common/PageMeta';
import Navbar from './Navbar';
import Footer from './Footer';

// Public page on "/masina": the same reminders for someone with one personal
// car. An experiment for traffic (CLAUDE.md §1): the app itself still speaks
// transport ("camion", "Flotă"), and the FAQ says so plainly.

const reminders = ['ITP', 'RCA', 'CASCO', 'Rovinietă', 'Impozit auto', 'Trusă medicală', 'Extinctor', 'Schimb ulei'];

const steps = [
    { number: '01', title: 'Îți faci cont', description: 'Doar email și parolă. Fără aplicație de instalat: merge din browser, pe telefon sau pe calculator.' },
    { number: '02', title: 'Adaugi mașina și datele', description: 'Numărul de înmatriculare și când expiră fiecare act. Durează două minute.' },
    { number: '03', title: 'Primești emailul', description: 'Cu 30 de zile înainte, apoi cu 7 zile, cu o zi și în ziua expirării. Nu trebuie să deschizi nimic.' },
];

const faqs = [
    { q: 'Chiar e gratuit?', a: 'Da. O mașină e gratuită pentru totdeauna. Dacă ai mai multe, fiecare mașină în plus va costa 25 de lei pe an, de la lansare. Acum, în perioada de testare, totul e gratuit.' },
    { q: 'Trebuie să instalez ceva?', a: 'Nu. Alertele vin pe email, iar aplicația merge din browser. Dacă vrei, o poți pune pe ecranul telefonului ca pe o aplicație.' },
    { q: 'E aceeași aplicație ca pentru firmele de transport?', a: 'Da, dar când îți faci contul de aici, vezi doar ce îți trebuie: mașinile tale, actele lor, actele tale și schimbul de ulei. Fără camioane, șoferi sau contabilitate.' },
    { q: 'Ce fac cu datele mele?', a: 'Le folosim doar ca să-ți trimitem alertele. Nu le vindem și nu le dăm nimănui.' },
];

export default function Masina() {
    const still = !!useReducedMotion();
    const rise = (delay: number) => ({
        initial: still ? false : { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5, delay },
    });

    return (
        <div className="bg-white text-black font-sans selection:bg-[#465fff] selection:text-white overflow-x-hidden">
            <PageMeta title="Alertă gratuită pentru ITP, RCA și rovinietă - FlotaLaZi"
                description="Primești un email înainte să-ți expire ITP-ul, RCA-ul sau rovinieta. Gratuit pentru o mașină, pentru totdeauna. Fără aplicație de instalat." />
            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-white">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-[2px] w-12 bg-[#465fff]" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Pentru mașina ta</span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1] tracking-tight mb-8">
                            Nu mai uita de <br className="hidden sm:block" />
                            <span className="bg-[#465fff] text-white px-4 py-2 inline-block mt-2">ITP, RCA și rovinietă.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed mb-10 max-w-xl">
                            Primești un email înainte să-ți expire un act al mașinii. Gratuit pentru o mașină, pentru totdeauna. Fără aplicație de instalat.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/signup?tip=personal" className="bg-black text-white px-10 py-5 font-black uppercase tracking-tight text-lg text-center border-2 border-black shadow-[4px_4px_0px_0px_#465fff] hover:bg-[#465fff] transition-all">
                                Creează cont gratuit
                            </Link>
                            <Link to="/" className="px-6 py-5 font-bold uppercase tracking-tight text-sm text-center border-2 border-black hover:bg-gray-50">
                                Ai o firmă de transport? →
                            </Link>
                        </div>
                    </div>

                    {/* The email they get */}
                    <motion.div {...rise(0.2)} className="relative mx-auto w-full max-w-md">
                        <div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#465fff]">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center bg-[#465fff]"><Mail className="h-5 w-5 text-white" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Email · 08:00</p>
                                    <p className="text-sm font-bold">FlotaLaZi</p>
                                </div>
                            </div>
                            <p className="text-lg font-black leading-snug mb-4">RCA — B 123 ABC: expiră în 7 zile</p>
                            <ul className="space-y-2 text-sm font-medium text-gray-600">
                                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Rovinietă — expiră în 20 de zile</li>
                                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />ITP — în regulă până în august</li>
                            </ul>
                        </div>
                        <div className="absolute -top-5 -right-3 flex h-12 w-12 items-center justify-center border-2 border-black bg-white">
                            <BellRing className="h-6 w-6 text-[#465fff]" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* What it reminds */}
            <section className="py-16 md:py-20 bg-black text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-10">Îți amintim de tot ce expiră</h2>
                    <div className="flex flex-wrap gap-3">
                        {reminders.map((r) => (
                            <span key={r} className="flex items-center gap-2 border-2 border-zinc-700 px-4 py-3 text-sm md:text-base font-bold uppercase tracking-tight">
                                <Check className="h-4 w-4 text-[#7592ff]" />{r}
                            </span>
                        ))}
                    </div>
                    <p className="mt-8 text-zinc-400 font-medium">Și orice alt act cu dată de expirare: îl scrii tu, îți amintim noi.</p>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 md:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-14">Gata în <span className="text-gray-400">2 minute</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {steps.map((s, i) => (
                            <motion.div key={s.number} {...rise(i * 0.15)}>
                                <div className="w-14 h-14 bg-[#465fff] text-white flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_#000000] mb-6">{s.number}</div>
                                <h3 className="text-2xl font-bold tracking-tight mb-3">{s.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{s.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Questions */}
            <section className="py-20 bg-white border-t-2 border-black">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-10">Întrebări</h2>
                    <div className="space-y-4">
                        {faqs.map((f) => (
                            <details key={f.q} className="group border-2 border-black p-5 open:shadow-[4px_4px_0px_0px_#465fff]">
                                <summary className="cursor-pointer list-none text-lg font-bold flex justify-between gap-4">
                                    {f.q}<span className="text-[#465fff] group-open:rotate-45 transition-transform">+</span>
                                </summary>
                                <p className="mt-4 text-gray-600 font-medium leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                    <div className="mt-14 text-center">
                        <Link to="/signup?tip=personal" className="inline-block bg-[#465fff] text-white px-12 py-5 font-black uppercase tracking-tight text-xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-black transition-all">
                            Creează cont gratuit
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
