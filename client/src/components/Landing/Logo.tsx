import LogoMark from '../common/LogoMark';

export default function Logo({ light = false }: { light?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <LogoMark className="w-8 h-8" />
            <span className={`text-xl font-black tracking-tighter ${light ? 'text-white' : 'text-black'}`}>FlotaLaZi</span>
        </div>
    );
}
