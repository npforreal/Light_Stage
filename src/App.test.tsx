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
    expect(screen.getByTitle("Stage 3D Preview")).toBeInTheDocument();
  });

  it("switches view modes on button click", async () => {
    render(<App />);

    const rundownBtn = screen.getByTitle("Cue Rundown List");
    fireEvent.click(rundownBtn);

    // Rundown-only view unmounts the split view's Timeline Tracks pane
    expect(screen.queryByText("Timeline Tracks")).not.toBeInTheDocument();

    const timelineBtn = screen.getByTitle("Timeline Tracks");
    fireEvent.click(timelineBtn);

    expect(screen.getByText("Timeline Tracks")).toBeInTheDocument();

    const stageBtn = screen.getByTitle("Stage 3D Preview");
    fireEvent.click(stageBtn);

    // Stage 3D is lazy-loaded; wait for the chunk before asserting.
    expect(await screen.findByTestId("stage-3d-view")).toBeInTheDocument();
  });

  it("toggles Operator Lock mode", () => {
    render(<App />);

    const lockBtn = screen.getByTitle(/Unlocked: Hotkeys active/i);
    expect(lockBtn).toBeInTheDocument();
    fireEvent.click(lockBtn);

    expect(screen.getByText("Đã khóa")).toBeInTheDocument();
    expect(screen.getByTitle(/Operator Locked: Hotkeys disabled/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/Operator Locked: Hotkeys disabled/i));
    expect(screen.getByText("Khóa")).toBeInTheDocument();
  });

  it("opens Export Modal on Export button click", () => {
    render(<App />);

    const exportBtn = screen.getByTitle("Export Reports & Project");
    fireEvent.click(exportBtn);

    expect(screen.getByText("Export & Print Reports")).toBeInTheDocument();
  });
});
