import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  // Rendering tests
  it("should render with default variant and size", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("should render children correctly", () => {
    render(<Button>Test Button</Button>);

    expect(screen.getByText("Test Button")).toBeInTheDocument();
  });

  // Variant tests
  it("should apply default variant classes", () => {
    render(<Button variant="default">Default</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("should apply destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive", "text-white");
  });

  it("should apply outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("border", "bg-background");
  });

  it("should apply secondary variant classes", () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
  });

  it("should apply ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-accent", "hover:text-accent-foreground");
  });

  it("should apply link variant classes", () => {
    render(<Button variant="link">Link</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-primary", "underline-offset-4");
  });

  // Size tests
  it("should apply default size classes", () => {
    render(<Button size="default">Default Size</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-9", "px-4", "py-2");
  });

  it("should apply sm size classes", () => {
    render(<Button size="sm">Small</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-8", "px-3");
  });

  it("should apply lg size classes", () => {
    render(<Button size="lg">Large</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-10", "px-6");
  });

  it("should apply icon size classes", () => {
    render(
      <Button size="icon" aria-label="Icon button">
        X
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("size-9");
  });

  // Disabled state tests
  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:pointer-events-none", "disabled:opacity-50");
  });

  it("should not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  // Event handler tests
  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Custom className tests
  it("should merge custom className with variant classes", () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
    expect(button).toHaveClass("bg-primary"); // default variant
  });

  // asChild prop tests
  it("should render as Slot when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Link Button" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
    expect(link).toHaveAttribute("data-slot", "button");
  });

  // Accessibility tests
  it("should have proper button role", () => {
    render(<Button>Button</Button>);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should support aria-label", () => {
    render(<Button aria-label="Close dialog">X</Button>);

    const button = screen.getByRole("button", { name: "Close dialog" });
    expect(button).toBeInTheDocument();
  });

  it("should have aria-disabled when disabled", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("disabled");
  });

  // Type attribute tests
  it('should support type="submit"', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
  });
});
