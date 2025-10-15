import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChatSkeleton from '../ChatSkeleton';

describe('ChatSkeleton', () => {
  // Rendering tests - initial variant
  it('should render initial variant with all skeleton elements', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const wrapper = container.firstChild;
    expect(wrapper).toBeInTheDocument();
  });

  it('should render header skeleton for initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    // Header skeleton: h-6 w-40
    const header = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('h-6') && el.className.includes('w-40')
    );
    expect(header).toBeInTheDocument();
  });

  it('should render large content skeleton for initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    // Large content block: h-28 w-full
    const content = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('h-28') && el.className.includes('w-full')
    );
    expect(content).toBeInTheDocument();
  });

  it('should render grid of skeleton cards for initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const grid = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('grid') && el.className.includes('sm:grid-cols-2')
    );
    expect(grid).toBeInTheDocument();
  });

  it('should render 2 card skeletons in grid for initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    // Two cards: h-32
    const cards = Array.from(container.querySelectorAll('div')).filter(
      (el) => el.className.includes('h-32')
    );
    expect(cards.length).toBe(2);
  });

  it('should hide second card on mobile for initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const cards = Array.from(container.querySelectorAll('div')).filter(
      (el) => el.className.includes('h-32')
    );

    // Second card should have hidden class
    expect(cards[1]).toHaveClass('hidden', 'sm:block');
  });

  // Rendering tests - response variant
  it('should render response variant with minimal skeleton elements', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    const wrapper = container.firstChild;
    expect(wrapper).toBeInTheDocument();
  });

  it('should render small header skeleton for response variant', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    // Small header: h-4 w-32
    const header = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('h-4') && el.className.includes('w-32')
    );
    expect(header).toBeInTheDocument();
  });

  it('should render medium content skeleton for response variant', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    // Medium content block: h-20 w-full
    const content = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('h-20') && el.className.includes('w-full')
    );
    expect(content).toBeInTheDocument();
  });

  it('should not render grid in response variant', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    const grid = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('grid')
    );
    expect(grid).toBeUndefined();
  });

  it('should not render card skeletons in response variant', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    const cards = Array.from(container.querySelectorAll('div')).filter(
      (el) => el.className.includes('h-32')
    );
    expect(cards.length).toBe(0);
  });

  // Animation tests
  it('should have animate-pulse class on all skeleton elements', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const animatedElements = Array.from(container.querySelectorAll('div')).filter(
      (el) => el.className.includes('animate-pulse')
    );
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should use color-mix background for shimmer effect', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const skeletonElements = Array.from(container.querySelectorAll('div')).filter(
      (el) => el.className.includes('bg-[color:color-mix')
    );
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('should have rounded-xl corners on skeleton elements', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const roundedElements = Array.from(container.querySelectorAll('div')).filter(
      (el) => el.className.includes('rounded-xl')
    );
    expect(roundedElements.length).toBeGreaterThan(0);
  });

  // Structure tests - initial variant
  it('should have space-y-5 spacing for initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('space-y-5');
  });

  it('should have gap-3 spacing in grid', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const grid = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('grid')
    );
    expect(grid).toHaveClass('gap-3');
  });

  // Structure tests - response variant
  it('should have space-y-3 spacing for response variant', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('space-y-3');
  });

  // Variant differences
  it('should have different spacing between variants', () => {
    const { container: initialContainer } = render(<ChatSkeleton variant="initial" />);
    const { container: responseContainer } = render(<ChatSkeleton variant="response" />);

    const initialWrapper = initialContainer.firstChild as HTMLElement;
    const responseWrapper = responseContainer.firstChild as HTMLElement;

    expect(initialWrapper).toHaveClass('space-y-5');
    expect(responseWrapper).toHaveClass('space-y-3');
  });

  it('should have different heights between variants', () => {
    const { container: initialContainer } = render(<ChatSkeleton variant="initial" />);
    const { container: responseContainer } = render(<ChatSkeleton variant="response" />);

    // Initial has h-28, response has h-20
    const initialContent = Array.from(initialContainer.querySelectorAll('div')).find(
      (el) => el.className.includes('h-28')
    );
    const responseContent = Array.from(responseContainer.querySelectorAll('div')).find(
      (el) => el.className.includes('h-20')
    );

    expect(initialContent).toBeInTheDocument();
    expect(responseContent).toBeInTheDocument();
  });

  it('should render more elements in initial variant than response variant', () => {
    const { container: initialContainer } = render(<ChatSkeleton variant="initial" />);
    const { container: responseContainer } = render(<ChatSkeleton variant="response" />);

    const initialDivs = initialContainer.querySelectorAll('div');
    const responseDivs = responseContainer.querySelectorAll('div');

    expect(initialDivs.length).toBeGreaterThan(responseDivs.length);
  });

  // Accessibility
  it('should have aria-hidden="true" for initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('should have aria-hidden="true" for response variant', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  // Grid responsiveness
  it('should have responsive grid columns', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    const grid = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('grid')
    );
    expect(grid).toHaveClass('sm:grid-cols-2');
  });

  // Element count tests
  it('should render exactly 3 skeleton elements in response variant', () => {
    const { container } = render(<ChatSkeleton variant="response" />);

    // Wrapper + header + content = 3 divs
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBe(3);
  });

  it('should render exactly 6 skeleton elements in initial variant', () => {
    const { container } = render(<ChatSkeleton variant="initial" />);

    // Wrapper + header + content + grid + 2 cards = 6 divs
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBe(6);
  });
});
