import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TextField } from "../../components/fleet/ui";

describe("TextField", () => {
    it("bounds date inputs to 2000-2099 so the year can't run to 6 digits", () => {
        render(<TextField label="Data" type="date" value="" onChange={() => {}} />);
        const input = screen.getByLabelText("Data");
        expect(input).toHaveAttribute("min", "2000-01-01");
        expect(input).toHaveAttribute("max", "2099-12-31");
    });

    it("leaves other inputs unbounded unless asked", () => {
        render(<TextField label="Km" type="number" value="" onChange={() => {}} />);
        expect(screen.getByLabelText("Km")).not.toHaveAttribute("max");
    });
});
