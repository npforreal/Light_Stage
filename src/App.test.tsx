import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("App Dual View Integration", () => {
  it("renders Light Stage header, dual view and toolbar", () => {
    render(<App />);
    expect(screen.getByText("Light Stage")).toBeInTheDocument();
    expect(screen.getByText("Show Time")).toBeInTheDocument();
    expect(screen.getByText("Cue Remainder")).toBeInTheDocument();

    // Mode buttons
    expect(screen.getByTitle("Cue Rundown List")).toBeInTheDocument();
    expect(screen.getByTitle("Split Dual View")).toBeInTheDocument();
    expect(screen.getByTitle("Timeline Tracks")).toBeInTheDocument();
  });

  it("switches view modes on button click", () => {
    render(<App />);

    const rundownBtn = screen.getByTitle("Cue Rundown List");
    fireEvent.click(rundownBtn);

    expect(screen.getByText("View Role:")).toBeInTheDocument();

    const timelineBtn = screen.getByTitle("Timeline Tracks");
    fireEvent.click(timelineBtn);

    expect(screen.getByText("Timeline Tracks")).toBeInTheDocument();
  });
});
