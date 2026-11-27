import PageMeta from '../common/PageMeta';
import Navbar from './Navbar';
import Hero from './Hero';
import ReadyToDrive from './ReadyToDrive';
import DocumentStrip from './DocumentStrip';
import Core from './Core';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Pricing from './Pricing';
import Faq from './Faq';
import CTA from './CTA';
import Footer from './Footer';

// Public landing page on "/". Same visual language as the old Streamloop
// homepage (neo-brutalist, #465fff), rewritten for FlotaLaZi.
export default function Landing() {
    return (
        <div className="bg-white text-black font-sans selection:bg-[#465fff] selection:text-white scroll-smooth overflow-x-hidden">
            <PageMeta title="FlotaLaZi — acte, revizii și profit pentru flota ta" description="Alerte pentru ITP, RCA, rovinietă, tahograf și actele șoferilor. Pentru firme de transport din România." />
            <Navbar />
            <Hero />
            <ReadyToDrive />
            <DocumentStrip />
            <Core />
            <Features />
            <HowItWorks />
            <Pricing />
            <Faq />
            <CTA />
            <Footer />
        </div>
    );
}
