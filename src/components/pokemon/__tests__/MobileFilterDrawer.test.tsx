import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MobileFilterDrawer } from '../MobileFilterDrawer';

describe('MobileFilterDrawer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // Rendering tests
  it('should not render when open is false', () => {
    render(
      <MobileFilterDrawer open={false} onOpenChange={vi.fn()}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div>Filter Content</div>
      </MobileFilterDrawer>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Filter Content')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div>Child 1</div>
        <button>Apply Filters</button>
      </MobileFilterDrawer>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument();
  });

  // Accessibility tests
  it('should have role="dialog"', () => {
    render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should have aria-modal="true"', () => {
    render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  // Interaction tests
  it('should call onOpenChange with false when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <MobileFilterDrawer open={true} onOpenChange={onOpenChange}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    const dialog = screen.getByRole('dialog');
    await user.click(dialog);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not call onOpenChange when clicking inside panel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <MobileFilterDrawer open={true} onOpenChange={onOpenChange}>
        <button>Inside Button</button>
      </MobileFilterDrawer>
    );

    const button = screen.getByRole('button', { name: 'Inside Button' });
    await user.click(button);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // Keyboard interactions
  it('should call onOpenChange with false when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <MobileFilterDrawer open={true} onOpenChange={onOpenChange}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // Portal rendering test
  it('should render as portal in document.body', () => {
    render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div data-testid="drawer-content">Content</div>
      </MobileFilterDrawer>
    );

    const content = screen.getByTestId('drawer-content');
    expect(document.body).toContainElement(content);
  });

  // Body scroll lock test
  it('should set body overflow to hidden when open', () => {
    const { rerender } = render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <MobileFilterDrawer open={false} onOpenChange={vi.fn()}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    expect(document.body.style.overflow).toBe('');
  });

  // Focus management test
  it('should contain panel with tabindex -1', () => {
    render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    const dialog = screen.getByRole('dialog');
    const panel = dialog.querySelector('[tabindex="-1"]');
    expect(panel).toBeInTheDocument();
  });

  // Backdrop styling test
  it('should have backdrop blur styles', () => {
    render(
      <MobileFilterDrawer open={true} onOpenChange={vi.fn()}>
        <div>Content</div>
      </MobileFilterDrawer>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('backdrop-blur-sm', 'bg-black/70');
  });
});
