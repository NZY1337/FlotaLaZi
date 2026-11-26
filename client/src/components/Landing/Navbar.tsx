import { motion } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router';
import { useAppContext } from '../../context/AppContext';
import Logo from './Logo';
import PromoBanner from './PromoBanner';

// Section links are plain anchors (/#…) so they work from any page; a route
// (no '#') goes through the router.
const links = [
    { href: '/masina', label: 'Mașina ta', badge: 'Nou' },
    { href: '/#functii', label: 'Funcții' },
    { href: '/#cum-functioneaza', label: 'Cum funcționează' },
    { href: '/#preturi', label: 'Prețuri' },
    { href: '/#intrebari', label: 'Întrebări' },
];

type NavItem = { href: string; label: string; badge?: string };

function NavLink({ link, className, onClick }: { link: NavItem; className: string; onClick?: () => void }) {
    const content = (
        <>
            {link.label}
            {link.badge && <span className="ml-2 border border-black bg-[#FFD60A] px-1.5 py-0.5 text-[9px] font-black text-black align-middle">{link.badge}</span>}
        </>
    );
    return link.href.includes('#')
        ? <a href={link.href} className={className} onClick={onClick}>{content}</a>
        : <Link to={link.href} className={className} onClick={onClick}>{content}</Link>;
}

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { session } = useAppContext();
    const cta = session ? { to: '/dashboard', label: 'Panou' } : { to: '/signup', label: 'Începe gratuit' };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <PromoBanner />
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" aria-label="FlotaLaZi"><Logo /></Link>

                <div className="hidden xl:flex items-center gap-8 text-[13px] font-bold tracking-widest uppercase">
                    {links.map((l) => <NavLink key={l.href} link={l} className="hover:text-gray-500 transition-colors" />)}
                </div>

                <div className="hidden xl:flex items-center gap-6">
                    {!session && <Link to="/signin" className="text-[13px] font-bold tracking-widest uppercase hover:text-gray-500">Intră în cont</Link>}
                    <Link to={cta.to} className="bg-black text-white px-8 py-3 font-bold uppercase tracking-tighter text-sm hover:bg-[#465fff] hover:border-[#465fff] transition-all border-2 border-black">
                        {cta.label}
                    </Link>
                </div>

                <button className="xl:hidden text-black" aria-label="Meniu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {mobileMenuOpen && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="xl:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-6 shadow-xl">
                    {links.map((l) => (
                        <NavLink key={l.href} link={l} className="text-sm font-bold tracking-widest uppercase" onClick={() => setMobileMenuOpen(false)} />
                    ))}
                    {!session && <Link to="/signin" className="text-sm font-bold tracking-widest uppercase">Intră în cont</Link>}
                    <Link to={cta.to} className="w-full bg-black text-white px-8 py-4 font-bold text-sm tracking-widest uppercase text-center">{cta.label}</Link>
                </motion.div>
            )}
        </nav>
    );
}
