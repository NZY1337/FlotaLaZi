const extractTitle = (content: string): string => {
    try {
        const parsed = JSON.parse(content);
        const firstParagraph = parsed?.content?.[0];

        if (firstParagraph?.content?.[0]?.text) {
            const text = firstParagraph.content[0].text;
            return text.length > 50 ? text.substring(0, 50) + "..." : text;
        }

        return "Journal Entry";
    } catch {
        return content.length > 50 ? content.substring(0, 50) + "..." : content || "Journal Entry";
    }
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
};

// Prices arrive from the backend as integers in minor units (cents).
// Presentation only — the amounts themselves are never computed client-side.
// narrowSymbol: ro-RO would otherwise print the ISO code ("299,00 EUR"); this gives "299,00 €" ("lei" for RON).
const formatPrice = (minorUnits: number, currency: string): string => {
    const formatter = new Intl.NumberFormat('ro-RO', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    return formatter.format(minorUnits / 10 ** fractionDigits);
};

export { extractTitle, formatDate, formatPrice };