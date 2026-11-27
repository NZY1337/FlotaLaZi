import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DateField, TextField } from "../../components/fleet/ui";
import { dotDateInput, formatDateInput, parseDateInput } from "../../helpers/fleet";

describe("Romanian dates", () => {
    it("reads day-first dates and refuses impossible ones", () => {
        expect(parseDateInput("26.11.2026")).toBe("2026-11-26");
        expect(parseDateInput("5.3.2026")).toBe("2026-03-05");
        expect(parseDateInput("26/11/2026")).toBe("2026-11-26");
        expect(parseDateInput("26112026")).toBe("2026-11-26");
        expect(parseDateInput("29.02.2028")).toBe("2028-02-29");
        expect(parseDateInput("29.02.2027")).toBeNull();
        expect(parseDateInput("31.04.2026")).toBeNull();
        expect(parseDateInput("26.13.2026")).toBeNull();
        expect(parseDateInput("26.11.1999")).toBeNull();
        expect(parseDateInput("26.11.202788")).toBeNull();
        expect(parseDateInput("26.11.")).toBeNull();
        expect(formatDateInput("2026-03-05")).toBe("05.03.2026");
        expect(formatDateInput("")).toBe("");
    });

    it("adds the dots while typing, but lets backspace remove them", () => {
        expect(dotDateInput("26", "2")).toBe("26.");
        expect(dotDateInput("26.11", "26.1")).toBe("26.11.");
        expect(dotDateInput("26/", "26")).toBe("26.");
        expect(dotDateInput("26", "26.")).toBe("26");
    });
});

describe("DateField", () => {
    function Harness({ initial = "", spy, max }: { initial?: string; spy: (v: string) => void; max?: string }) {
        const [value, setValue] = useState(initial);
        return <form><DateField label="Data" value={value} onChange={(v) => { setValue(v); spy(v); }} required max={max} /></form>;
    }

    it("opens the calendar from a real date input over the icon (a tap on phones), and takes its date", () => {
        const spy = vi.fn();
        render(<Harness spy={spy} max="2026-11-27" />);
        const picker = screen.getByLabelText("Alege data din calendar") as HTMLInputElement;
        expect(picker.type).toBe("date");
        expect(picker.max).toBe("2026-11-27");

        fireEvent.change(picker, { target: { value: "2026-11-20" } });
        expect(spy).toHaveBeenLastCalledWith("2026-11-20");
        expect(screen.getByLabelText("Data *")).toHaveValue("20.11.2026");
    });

    it("refuses a day after max (things that already happened)", () => {
        render(<Harness spy={vi.fn()} max="2026-11-27" />);
        const input = screen.getByLabelText("Data *") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "27.11.2026" } });
        expect(input.validity.valid).toBe(true);

        fireEvent.change(input, { target: { value: "03.12.2026" } });
        expect(input.validity.valid).toBe(false);
        expect(screen.getByText("Data nu poate fi în viitor.")).toBeInTheDocument();
    });

    it("shows the stored date as zz.ll.aaaa and stores what is typed as YYYY-MM-DD", () => {
        const spy = vi.fn();
        render(<Harness initial="2026-03-05" spy={spy} />);
        const input = screen.getByLabelText("Data *") as HTMLInputElement;
        expect(input).toHaveValue("05.03.2026");

        fireEvent.change(input, { target: { value: "26.11.2026" } });
        expect(spy).toHaveBeenLastCalledWith("2026-11-26");
        expect(input).toHaveValue("26.11.2026");
        expect(input.validity.valid).toBe(true);
    });

    it("keeps a half-typed date on screen and blocks the form while it is not a real day", () => {
        const spy = vi.fn();
        render(<Harness spy={spy} />);
        const input = screen.getByLabelText("Data *") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "26.1" } });
        expect(input).toHaveValue("26.1");
        expect(spy).toHaveBeenLastCalledWith("");

        fireEvent.change(input, { target: { value: "31.02.2026" } });
        expect(spy).toHaveBeenLastCalledWith("");
        expect(input.validity.valid).toBe(false);
        expect(screen.getByText(/Data nu e bună/)).toBeInTheDocument();
    });

    it("bounds the calendar picker to 2000-2099, like the server", () => {
        const { container } = render(<Harness spy={() => {}} />);
        const picker = container.querySelector('input[type="date"]');
        expect(picker).toHaveAttribute("min", "2000-01-01");
        expect(picker).toHaveAttribute("max", "2099-12-31");
    });
});

describe("TextField", () => {
    it("leaves inputs unbounded unless asked", () => {
        render(<TextField label="Km" type="number" value="" onChange={() => {}} />);
        expect(screen.getByLabelText("Km")).not.toHaveAttribute("max");
    });
});
