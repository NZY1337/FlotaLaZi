import type { SVGProps } from 'react';

// The FlotaLaZi mark: a road that turns into a check — "on the road, papers
// in order". Blue square, white check, the long stroke carries the road's
// dashed middle line (it fades out at favicon sizes, the check stays).
// An <svg> of its own, so it also nests inside another SVG (x, y, width, height).
// The same drawing is in client/public (favicons), og-image.png and the
// Supabase email templates; change them together.
export default function LogoMark(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
            <rect width="100" height="100" rx="18" fill="#465fff" />
            <path d="M22 54 L42 74 L80 28" fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M47 67 L77 31" fill="none" stroke="#465fff" strokeWidth="3.5" strokeDasharray="7 6" strokeLinecap="round" />
        </svg>
    );
}
