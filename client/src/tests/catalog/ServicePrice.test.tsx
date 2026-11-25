import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ServicePrice from "../../pages/Dashboard/Services/ServicePrice";
import { buildService } from "./test-utils";

// Prices arrive in cents; the display must show them as currency amounts.
describe("ServicePrice", () => {
    it("shows a one-time service as a single price", () => {
        const { container } = render(<ServicePrice service={buildService({ price: 29900 })} />);

        expect(container).toHaveTextContent(/299,00\s*€/);
        expect(screen.getByText("plată unică")).toBeInTheDocument();
    });

    it("shows setup + monthly price for a subscription", () => {
        const { container } = render(
            <ServicePrice
                service={buildService({ billingType: "SUBSCRIPTION", price: 29900, recurringPrice: 4900 })}
            />,
        );

        expect(container).toHaveTextContent(/299,00\s*€/);
        expect(container).toHaveTextContent(/setup \+ 49,00\s*€ \/ lună/);
    });

    it("falls back to just 'setup' for a subscription with no recurring price", () => {
        render(
            <ServicePrice
                service={buildService({ billingType: "SUBSCRIPTION", recurringPrice: null })}
            />,
        );

        expect(screen.getByText("setup")).toBeInTheDocument();
        expect(screen.queryByText(/\/ lună/)).not.toBeInTheDocument();
    });
});
