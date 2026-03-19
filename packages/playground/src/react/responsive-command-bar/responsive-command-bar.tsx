import {
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Toolbar,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { MoreHorizontal24Filled } from "@fluentui/react-icons";
import { Fragment, type FunctionComponent, type ReactNode } from "react";
import style from "./responsive-command-bar.module.css";

/** Defines a single item in a responsive command bar. */
export interface CommandBarItem {
  /** Unique identifier for the item. */
  readonly id: string;
  /** Display label used for tooltip (desktop) and menu text (mobile). */
  readonly label: string;
  /** Icon element. */
  readonly icon?: ReactNode;
  /** Click handler for simple items. */
  readonly onClick?: () => void;
  /** If true, always visible as an icon button. If false (default), goes to overflow menu on mobile. */
  readonly pinned?: boolean;
  /** Sub-items rendered as a dropdown (desktop) or nested submenu (mobile). */
  readonly children?: readonly CommandBarItem[];
  /** Additional content rendered alongside the command bar (e.g., dialogs triggered by children). */
  readonly content?: ReactNode;
  /** Custom toolbar element for desktop rendering. Overrides default and children-based rendering. */
  readonly toolbarItem?: ReactNode;
  /** Custom menu element for mobile overflow menu. Overrides default and children-based rendering. */
  readonly menuItem?: ReactNode;
  /** Alignment group on the desktop toolbar. Defaults to "left". */
  readonly align?: "left" | "right";
}

export interface ResponsiveCommandBarProps {
  /** The items to render in the command bar. */
  readonly items: readonly CommandBarItem[];
  /** Whether to render in mobile (compact) mode. */
  readonly isMobile: boolean;
}

/**
 * A generic responsive command bar that renders items as a toolbar on desktop
 * and collapses non-pinned items into a hamburger overflow menu on mobile.
 */
export const ResponsiveCommandBar: FunctionComponent<ResponsiveCommandBarProps> = ({
  items,
  isMobile,
}) => {
  const pinnedItems = items.filter((i) => i.pinned);
  const overflowItems = items.filter((i) => !i.pinned);
  const leftItems = items.filter((i) => (i.align ?? "left") === "left");
  const rightItems = items.filter((i) => i.align === "right");
  const leftOverflow = overflowItems.filter((i) => (i.align ?? "left") === "left");
  const rightOverflow = overflowItems.filter((i) => i.align === "right");

  return (
    <div className={style["bar"]}>
      <Toolbar>
        {isMobile ? (
          <>
            {pinnedItems.map((item) => (
              <ToolbarItemRenderer key={item.id} item={item} />
            ))}
            {overflowItems.length > 0 && (
              <>
                <div className={style["divider"]} />
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Tooltip content="More actions" relationship="description" withArrow>
                      <ToolbarButton
                        aria-label="More actions"
                        icon={<MoreHorizontal24Filled />}
                        appearance="subtle"
                      />
                    </Tooltip>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {leftOverflow.map((item) => (
                        <MenuItemRenderer key={item.id} item={item} />
                      ))}
                      {leftOverflow.length > 0 && rightOverflow.length > 0 && <MenuDivider />}
                      {rightOverflow.map((item) => (
                        <MenuItemRenderer key={item.id} item={item} />
                      ))}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </>
            )}
          </>
        ) : (
          <>
            {leftItems.map((item) => (
              <ToolbarItemRenderer key={item.id} item={item} />
            ))}
            {rightItems.length > 0 && <div className={style["divider"]} />}
            {rightItems.map((item) => (
              <ToolbarItemRenderer key={item.id} item={item} />
            ))}
          </>
        )}
      </Toolbar>
      {items.map((item) => item.content && <Fragment key={item.id}>{item.content}</Fragment>)}
    </div>
  );
};

const ToolbarItemRenderer: FunctionComponent<{ item: CommandBarItem }> = ({ item }) => {
  if (item.toolbarItem) return <>{item.toolbarItem}</>;
  if (item.children) {
    return (
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Tooltip content={item.label} relationship="description" withArrow>
            <ToolbarButton appearance="subtle" aria-label={item.label} icon={item.icon as any} />
          </Tooltip>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {item.children.map((child) => (
              <MenuItem key={child.id} icon={child.icon as any} onClick={child.onClick as any}>
                {child.label}
              </MenuItem>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
    );
  }
  return (
    <Tooltip content={item.label} relationship="description" withArrow>
      <ToolbarButton
        aria-label={item.label}
        icon={item.icon as any}
        onClick={item.onClick as any}
      />
    </Tooltip>
  );
};

const MenuItemRenderer: FunctionComponent<{ item: CommandBarItem }> = ({ item }) => {
  if (item.menuItem) return <>{item.menuItem}</>;
  if (item.children) {
    return (
      <Menu openOnHover={false}>
        <MenuTrigger disableButtonEnhancement>
          <MenuItem icon={item.icon as any}>{item.label}</MenuItem>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {item.children.map((child) => (
              <MenuItem key={child.id} icon={child.icon as any} onClick={child.onClick as any}>
                {child.label}
              </MenuItem>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
    );
  }
  return (
    <MenuItem icon={item.icon as any} onClick={item.onClick as any}>
      {item.label}
    </MenuItem>
  );
};
