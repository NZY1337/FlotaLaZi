import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { parseNumberInput, formatNumberInput } from "../../helpers/fleet";
import { NumberField } from "../../components/fleet/ui";

describe("parseNumberInput (money, 2 decimals)", () => {
    it.each([
        ["1000", 1000],
        ["1.500", 1500],          // Romanian thousands: the bug this guards against
        ["12.000", 12000],
        ["1.250.000", 1250000],
        ["1.500,50", 1500.5],
        ["1,500.50", 1500.5],
        ["1500,5", 1500.5],
        ["12.5", 12.5],
        ["1,09", 1.09],
        ["1.09", 1.09],
        [" 1 500 ", 1500],
        ["", null],
        ["1,500", null],          // 3 decimals: ambiguous, ask again
        ["1.5.0", null],
        ["12,345", null],
        ["abc", null],
        ["-5", null],
    ])("%j → %j", (input, expected) => {
        expect(parseNumberInput(input, 2)).toBe(expected);
    });
});

describe("parseNumberInput (km, whole numbers)", () => {
    it.each([
        ["450000", 450000],
        ["450.000", 450000],
        ["450 000", 450000],
        ["450,5", null],
        ["12.5", null],
    ])("%j → %j", (input, expected) => {
        expect(parseNumberInput(input, 0)).toBe(expected);
    });
});

it("formats the reading back the Romanian way", () => {
    expect(formatNumberInput(1500.5, 2)).toBe("1.500,50");
    expect(formatNumberInput(450000, 0)).toBe("450.000");
});

function Harness({ onSubmit }: { onSubmit: () => void }) {
    const [value, setValue] = useState("");
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <NumberField label="Sumă" decimals={2} unit="lei" min={0.01} value={value} onChange={setValue} required />
            <button type="submit">Salvează</button>
        </form>
    );
}

describe("NumberField", () => {
    it("shows how it read 1.500: one thousand five hundred", () => {
        render(<Harness onSubmit={() => {}} />);
        fireEvent.change(screen.getByLabelText(/Sumă/), { target: { value: "1.500" } });
        expect(screen.getByText("= 1.500,00 lei")).toBeInTheDocument();
    });

    it("blocks the form on an unclear amount", () => {
        const onSubmit = vi.fn();
        render(<Harness onSubmit={onSubmit} />);
        const input = screen.getByLabelText(/Sumă/) as HTMLInputElement;
        fireEvent.change(input, { target: { value: "1,500" } });
        expect(screen.getByText(/Sumă neclară/)).toBeInTheDocument();
        expect(input.validity.valid).toBe(false);
        fireEvent.click(screen.getByText("Salvează"));
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
