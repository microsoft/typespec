import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ResponsiveCommandBar,
  type CommandBarItem,
} from "../src/react/responsive-command-bar/index.js";

function renderBar(items: CommandBarItem[], isMobile = false) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <ResponsiveCommandBar items={items} isMobile={isMobile} />
    </FluentProvider>,
  );
}

describe("ResponsiveCommandBar", () => {
  describe("desktop mode", () => {
    it("renders all items as toolbar buttons", () => {
      const items: CommandBarItem[] = [
        { id: "save", label: "Save", onClick: vi.fn() },
        { id: "format", label: "Format", onClick: vi.fn() },
      ];
      renderBar(items, false);
      expect(screen.getByLabelText("Save")).toBeInTheDocument();
      expect(screen.getByLabelText("Format")).toBeInTheDocument();
    });

    it("renders left items before right items with a divider between", () => {
      const items: CommandBarItem[] = [
        { id: "left1", label: "Left One", onClick: vi.fn() },
        { id: "right1", label: "Right One", onClick: vi.fn(), align: "right" },
      ];
      renderBar(items, false);
      expect(screen.getByLabelText("Left One")).toBeInTheDocument();
      expect(screen.getByLabelText("Right One")).toBeInTheDocument();
    });

    it("calls onClick when a toolbar button is clicked", () => {
      const onClick = vi.fn();
      renderBar([{ id: "action", label: "Action", onClick }], false);
      fireEvent.click(screen.getByLabelText("Action"));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("renders custom toolbarItem when provided", () => {
      const items: CommandBarItem[] = [
        {
          id: "custom",
          label: "Custom",
          toolbarItem: <button data-testid="custom-btn">Custom Button</button>,
        },
      ];
      renderBar(items, false);
      expect(screen.getByTestId("custom-btn")).toBeInTheDocument();
    });

    it("renders children as a dropdown menu", () => {
      const childClick = vi.fn();
      const items: CommandBarItem[] = [
        {
          id: "parent",
          label: "Parent",
          children: [{ id: "child1", label: "Child One", onClick: childClick }],
        },
      ];
      renderBar(items, false);
      // The parent renders as a button with aria-label
      const trigger = screen.getByLabelText("Parent");
      fireEvent.click(trigger);
      // After clicking, the dropdown should show the child
      expect(screen.getByText("Child One")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Child One"));
      expect(childClick).toHaveBeenCalledOnce();
    });
  });

  describe("mobile mode", () => {
    it("renders pinned items directly and overflow in a menu", () => {
      const items: CommandBarItem[] = [
        { id: "pinned", label: "Pinned", onClick: vi.fn(), pinned: true },
        { id: "overflow", label: "Overflow Item", onClick: vi.fn() },
      ];
      renderBar(items, true);
      // Pinned item is directly visible
      expect(screen.getByLabelText("Pinned")).toBeInTheDocument();
      // Overflow item is hidden behind the hamburger
      expect(screen.queryByText("Overflow Item")).not.toBeInTheDocument();
      // Open the hamburger menu
      fireEvent.click(screen.getByLabelText("More actions"));
      expect(screen.getByText("Overflow Item")).toBeInTheDocument();
    });

    it("calls onClick on overflow menu item click", () => {
      const onClick = vi.fn();
      const items: CommandBarItem[] = [{ id: "action", label: "Action", onClick }];
      renderBar(items, true);
      fireEvent.click(screen.getByLabelText("More actions"));
      fireEvent.click(screen.getByText("Action"));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("renders a divider between left and right overflow items", () => {
      const items: CommandBarItem[] = [
        { id: "left", label: "Left Item", onClick: vi.fn() },
        { id: "right", label: "Right Item", onClick: vi.fn(), align: "right" },
      ];
      const { container } = renderBar(items, true);
      fireEvent.click(screen.getByLabelText("More actions"));
      // Both items should be visible in the menu
      expect(screen.getByText("Left Item")).toBeInTheDocument();
      expect(screen.getByText("Right Item")).toBeInTheDocument();
      // MenuDivider renders as an element with role="separator"
      const divider = container.ownerDocument.querySelector(
        "[class*='fui-MenuDivider'], [role='separator']",
      );
      expect(divider).toBeTruthy();
    });

    it("does not render divider when all overflow items are on the same side", () => {
      const items: CommandBarItem[] = [
        { id: "a", label: "Item A", onClick: vi.fn() },
        { id: "b", label: "Item B", onClick: vi.fn() },
      ];
      renderBar(items, true);
      fireEvent.click(screen.getByLabelText("More actions"));
      const menuPopover = screen.getByText("Item A").closest("[role='menu']");
      expect(menuPopover?.querySelector("[role='separator']")).not.toBeInTheDocument();
    });

    it("renders custom menuItem when provided", () => {
      const items: CommandBarItem[] = [
        {
          id: "custom",
          label: "Custom",
          menuItem: <div data-testid="custom-menu">Custom Menu Content</div>,
        },
      ];
      renderBar(items, true);
      fireEvent.click(screen.getByLabelText("More actions"));
      expect(screen.getByTestId("custom-menu")).toBeInTheDocument();
    });

    it("does not show hamburger when all items are pinned", () => {
      const items: CommandBarItem[] = [
        { id: "a", label: "A", onClick: vi.fn(), pinned: true },
        { id: "b", label: "B", onClick: vi.fn(), pinned: true },
      ];
      renderBar(items, true);
      expect(screen.queryByLabelText("More actions")).not.toBeInTheDocument();
    });

    it("renders children as a nested submenu in overflow", () => {
      const childClick = vi.fn();
      const items: CommandBarItem[] = [
        {
          id: "parent",
          label: "Parent",
          children: [{ id: "child", label: "Nested Child", onClick: childClick }],
        },
      ];
      renderBar(items, true);
      fireEvent.click(screen.getByLabelText("More actions"));
      // Parent appears as a menu item that triggers a submenu
      const parentItem = screen.getByText("Parent");
      expect(parentItem).toBeInTheDocument();
      fireEvent.click(parentItem);
      expect(screen.getByText("Nested Child")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Nested Child"));
      expect(childClick).toHaveBeenCalledOnce();
    });
  });

  describe("content rendering", () => {
    it("renders item content outside the toolbar", () => {
      const items: CommandBarItem[] = [
        {
          id: "with-content",
          label: "Item",
          onClick: vi.fn(),
          content: <div data-testid="extra-content">Extra</div>,
        },
      ];
      renderBar(items, false);
      expect(screen.getByTestId("extra-content")).toBeInTheDocument();
    });

    it("renders content in mobile mode too", () => {
      const items: CommandBarItem[] = [
        {
          id: "with-content",
          label: "Item",
          onClick: vi.fn(),
          content: <div data-testid="mobile-content">Mobile Extra</div>,
        },
      ];
      renderBar(items, true);
      expect(screen.getByTestId("mobile-content")).toBeInTheDocument();
    });
  });
});
