export default function Logo({ light = false }: { light?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#465fff] flex items-center justify-center text-white font-black text-xl">E</div>
            <span className={`text-xl font-black tracking-tighter uppercase ${light ? 'text-white' : 'text-black'}`}>EuroTrack</span>
        </div>
    );
}
