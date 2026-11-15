import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders Light Stage header and status", () => {
    render(<App />);
    expect(screen.getByText("Light Stage")).toBeInTheDocument();
    expect(screen.getByText("Live Stage Coordination")).toBeInTheDocument();
  });
});
