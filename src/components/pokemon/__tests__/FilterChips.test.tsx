import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { FilterChips } from "../FilterChips";
import type { FilterChipViewModel } from "@/lib/pokemon/types";

describe("FilterChips", () => {
  const mockChips: FilterChipViewModel[] = [
    {
      id: "type-electric",
      label: "Electric",
      onRemove: vi.fn(),
    },
    {
      id: "gen-1",
      label: "Gen 1",
      onRemove: vi.fn(),
    },
  ];

  // Rendering tests
  it("should render chips list", () => {
    render(<FilterChips chips={mockChips} />);

    expect(screen.getByText("Electric")).toBeInTheDocument();
    expect(screen.getByText("Gen 1")).toBeInTheDocument();
  });

  it("should not render when chips array is empty", () => {
    const { container } = render(<FilterChips chips={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("should render clear all button when onClearAll is provided", () => {
    const onClearAll = vi.fn();
    render(<FilterChips chips={mockChips} onClearAll={onClearAll} />);

    expect(screen.getByText("Wyczyść wszystko")).toBeInTheDocument();
  });

  it("should not render clear all button when onClearAll is not provided", () => {
    render(<FilterChips chips={mockChips} />);

    expect(screen.queryByText("Wyczyść wszystko")).not.toBeInTheDocument();
  });

  // Interaction tests
  it("should call onRemove when chip remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const chips = [
      {
        id: "type-fire",
        label: "Fire",
        onRemove,
      },
    ];

    render(<FilterChips chips={chips} />);

    const removeButton = screen.getByRole("button", { name: /Usuń filtr Fire/i });
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("should call onClearAll when clear all button is clicked", async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();

    render(<FilterChips chips={mockChips} onClearAll={onClearAll} />);

    const clearButton = screen.getByText("Wyczyść wszystko");
    await user.click(clearButton);

    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("should call correct onRemove for each chip", async () => {
    const user = userEvent.setup();
    const onRemove1 = vi.fn();
    const onRemove2 = vi.fn();
    const chips = [
      { id: "1", label: "Chip 1", onRemove: onRemove1 },
      { id: "2", label: "Chip 2", onRemove: onRemove2 },
    ];

    render(<FilterChips chips={chips} />);

    await user.click(screen.getByRole("button", { name: /Usuń filtr Chip 1/i }));
    expect(onRemove1).toHaveBeenCalledTimes(1);
    expect(onRemove2).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Usuń filtr Chip 2/i }));
    expect(onRemove2).toHaveBeenCalledTimes(1);
  });

  // Accessibility tests
  it("should have proper aria-label for remove buttons", () => {
    render(<FilterChips chips={mockChips} />);

    expect(screen.getByRole("button", { name: "Usuń filtr Electric" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usuń filtr Gen 1" })).toBeInTheDocument();
  });

  it("should have aria-hidden on close icon", () => {
    const { container } = render(<FilterChips chips={mockChips} />);

    const closeIcons = container.querySelectorAll('[aria-hidden="true"]');
    expect(closeIcons.length).toBe(2);
    expect(closeIcons[0]).toHaveTextContent("×");
  });

  // Rendering with different chip counts
  it("should render single chip", () => {
    const singleChip = [
      {
        id: "single",
        label: "Single Chip",
        onRemove: vi.fn(),
      },
    ];

    render(<FilterChips chips={singleChip} />);

    expect(screen.getByText("Single Chip")).toBeInTheDocument();
  });

  it("should render many chips", () => {
    const manyChips = Array.from({ length: 10 }, (_, i) => ({
      id: `chip-${i}`,
      label: `Chip ${i}`,
      onRemove: vi.fn(),
    }));

    render(<FilterChips chips={manyChips} />);

    manyChips.forEach((chip) => {
      expect(screen.getByText(chip.label)).toBeInTheDocument();
    });
  });

  // Button types test
  it("should render chip buttons with correct type", () => {
    render(<FilterChips chips={mockChips} />);

    const buttons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Electric") || btn.textContent?.includes("Gen 1"));
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("type", "button");
    });
  });

  it("should render clear all button with correct type", () => {
    render(<FilterChips chips={mockChips} onClearAll={vi.fn()} />);

    const clearButton = screen.getByText("Wyczyść wszystko");
    expect(clearButton).toHaveAttribute("type", "button");
  });
});
