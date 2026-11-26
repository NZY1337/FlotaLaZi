import { Link } from 'react-router';
import Logo from './Logo';

export default function Footer() {
    return (
        <footer className="py-20 bg-white border-t-2 border-black">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
                    <div>
                        <div className="mb-6"><Logo /></div>
                        <p className="text-sm font-bold text-gray-400 leading-relaxed">
                            Actele, reviziile și profitul flotei tale — într-un singur loc. Pentru firme de transport din România.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold uppercase tracking-tight mb-6">Produs</h4>
                        <ul className="space-y-3 text-sm font-bold text-gray-400">
                            <li><a href="/#functii" className="hover:text-black transition-colors">Funcții</a></li>
                            <li><a href="/#cum-functioneaza" className="hover:text-black transition-colors">Cum funcționează</a></li>
                            <li><a href="/#preturi" className="hover:text-black transition-colors">Prețuri</a></li>
                            <li><a href="/#intrebari" className="hover:text-black transition-colors">Întrebări</a></li>
                            <li><Link to="/masina" className="hover:text-black transition-colors">Pentru mașina personală</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold uppercase tracking-tight mb-6">Cont</h4>
                        <ul className="space-y-3 text-sm font-bold text-gray-400">
                            <li><Link to="/signup" className="hover:text-black transition-colors">Creează cont</Link></li>
                            <li><Link to="/signin" className="hover:text-black transition-colors">Intră în cont</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                    <p>© {new Date().getFullYear()} FlotaLaZi. Toate drepturile rezervate.</p>
                    <p className="normal-case tracking-normal font-medium">Fotografii: Pexels, Faridvisuals (Pexels), Wolfgang Hasselmann (Unsplash)</p>
                </div>
            </div>
        </footer>
    );
}
