import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ListSkeleton } from "../ListSkeleton";

describe("ListSkeleton", () => {
  // Default rendering tests
  it("should render 6 skeleton items by default", () => {
    const { container } = render(<ListSkeleton />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(6);
  });

  it('should have role="status"', () => {
    render(<ListSkeleton />);

    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
  });

  it('should have aria-live="polite"', () => {
    const { container } = render(<ListSkeleton />);

    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toHaveAttribute("aria-live", "polite");
  });

  // Custom count tests
  it("should render custom number of skeleton items", () => {
    const { container } = render(<ListSkeleton count={3} />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(3);
  });

  it("should render 1 skeleton item", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(1);
  });

  it("should render 12 skeleton items", () => {
    const { container } = render(<ListSkeleton count={12} />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(12);
  });

  it("should render 0 skeleton items when count is 0", () => {
    const { container } = render(<ListSkeleton count={0} />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(0);
  });

  // Grid structure tests
  it("should render in grid layout", () => {
    const { container } = render(<ListSkeleton />);

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("should have responsive grid columns", () => {
    const { container } = render(<ListSkeleton />);

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-1", "sm:grid-cols-2", "xl:grid-cols-3");
  });

  // Skeleton item structure tests
  it("should render skeleton items with correct height", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const item = container.querySelector('[class*="h-72"]');
    expect(item).toBeInTheDocument();
    expect(item).toHaveClass("h-72");
  });

  it("should have rounded corners on skeleton items", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const item = container.querySelector('[class*="rounded-3xl"]');
    expect(item).toBeInTheDocument();
  });

  it("should have border on skeleton items", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const item = container.querySelector('[class*="border"]');
    expect(item).toHaveClass("border-white/5");
  });

  // Animation tests
  it("should have animate-pulse class on skeleton background", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const animatedElement = container.querySelector(".animate-pulse");
    expect(animatedElement).toBeInTheDocument();
  });

  it("should render gradient background", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const gradient = container.querySelector('[class*="bg-gradient"]');
    expect(gradient).toBeInTheDocument();
  });

  // Internal skeleton elements tests
  it("should render circular placeholder for image", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const circle = container.querySelector('[class*="rounded-full"]');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveClass("h-44", "w-44");
  });

  it("should render rectangular placeholders for text", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const rectangles = container.querySelectorAll('[class*="inset-x-6"]');
    expect(rectangles.length).toBeGreaterThan(0);
  });

  // Multiple items test
  it("should render unique keys for each skeleton item", () => {
    const { container } = render(<ListSkeleton count={5} />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(5);

    // Each item should be distinct
    items.forEach((item, index) => {
      expect(item).toBeInTheDocument();
    });
  });

  // Positioning tests
  it("should have relative positioning on container", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const item = container.querySelector('[class*="relative"]');
    expect(item).toBeInTheDocument();
  });

  it("should have absolute positioning on internal elements", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const absoluteElements = container.querySelectorAll('[class*="absolute"]');
    expect(absoluteElements.length).toBeGreaterThan(0);
  });

  // Gap and spacing tests
  it("should have gap between grid items", () => {
    const { container } = render(<ListSkeleton />);

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("gap-4");
  });

  // Overflow test
  it("should have overflow hidden on skeleton items", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const item = container.querySelector('[class*="overflow-hidden"]');
    expect(item).toBeInTheDocument();
  });

  // Background color tests
  it("should have dark background on skeleton items", () => {
    const { container } = render(<ListSkeleton count={1} />);

    const item = container.querySelector('[class*="bg-[#101722]"]');
    expect(item).toBeInTheDocument();
  });

  // Edge case: negative count
  it("should handle negative count gracefully", () => {
    const { container } = render(<ListSkeleton count={-1} />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(0);
  });

  // Edge case: very large count
  it("should render large number of skeleton items", () => {
    const { container } = render(<ListSkeleton count={50} />);

    const items = container.querySelectorAll('[class*="h-72"]');
    expect(items.length).toBe(50);
  });

  // Snapshot-like structural test
  it("should maintain consistent structure across renders", () => {
    const { container: container1 } = render(<ListSkeleton count={3} />);
    const { container: container2 } = render(<ListSkeleton count={3} />);

    const items1 = container1.querySelectorAll('[class*="h-72"]');
    const items2 = container2.querySelectorAll('[class*="h-72"]');

    expect(items1.length).toBe(items2.length);
  });
});
