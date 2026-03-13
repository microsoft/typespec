import {
  Link,
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
import {
  BookOpen16Regular,
  Broom16Filled,
  Bug16Regular,
  Checkmark16Regular,
  DocumentBulletList24Regular,
  MoreHorizontal24Filled,
  Save16Regular,
} from "@fluentui/react-icons";
import {
  Fragment,
  useCallback,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { EmitterDropdown } from "../react/emitter-dropdown.js";
import { SamplesDrawerOverlay, SamplesDrawerTrigger } from "../react/samples-drawer/index.js";
import { useIsMobile } from "../react/use-mobile.js";
import type { BrowserHost, PlaygroundSample } from "../types.js";
import style from "./editor-command-bar.module.css";

/** Defines a single item in the editor command bar. */
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
  /** Additional content rendered alongside this item (e.g., dialogs triggered by children). */
  readonly content?: ReactNode;
  /** Custom toolbar element for desktop rendering. Overrides default and children-based rendering. */
  readonly toolbarItem?: ReactNode;
  /** Custom menu element for mobile overflow menu. Overrides default and children-based rendering. */
  readonly menuItem?: ReactNode;
  /** Renders a divider after this item in the mobile overflow menu. */
  readonly overflowDivider?: boolean;
  /** Renders a flex spacer before this item on the desktop toolbar. */
  readonly toolbarSpacer?: boolean;
  /** Renders a divider before this item on the desktop toolbar. */
  readonly toolbarDivider?: boolean;
}

export interface EditorCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  formatCode: () => Promise<void> | void;
  fileBug?: () => Promise<void> | void;
  /** Additional items provided by the consumer. */
  commandBarItems?: readonly CommandBarItem[];
  host: BrowserHost;
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;

  samples?: Record<string, PlaygroundSample>;
  selectedSampleName: string;
  onSelectedSampleNameChange: (sampleName: string) => void;
}

export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = (props) => {
  const {
    documentationUrl,
    saveCode,
    formatCode,
    fileBug,
    host,
    selectedEmitter,
    onSelectedEmitterChange,
    samples,
    onSelectedSampleNameChange,
    commandBarItems: externalItems,
  } = props;

  const isMobile = useIsMobile();
  const [samplesDrawerOpen, setSamplesDrawerOpen] = useState(false);

  const emitters = useMemo(
    () =>
      Object.values(host.libraries)
        .filter((x) => x.isEmitter)
        .map((x) => x.name),
    [host.libraries],
  );

  const handleFileBug = useCallback(() => {
    if (fileBug) void fileBug();
  }, [fileBug]);

  const items = useMemo<CommandBarItem[]>(() => {
    const result: CommandBarItem[] = [
      {
        id: "save",
        label: "Save",
        icon: <Save16Regular />,
        onClick: saveCode as () => void,
        pinned: true,
      },
      {
        id: "format",
        label: "Format",
        icon: <Broom16Filled />,
        onClick: formatCode as () => void,
        pinned: true,
      },
    ];

    if (samples) {
      result.push({
        id: "samples",
        label: "Browse Samples",
        icon: <DocumentBulletList24Regular />,
        onClick: () => setSamplesDrawerOpen(true),
        toolbarItem: (
          <SamplesDrawerTrigger
            samples={samples}
            onSelectedSampleNameChange={onSelectedSampleNameChange}
          />
        ),
      });
    }

    result.push({
      id: "emitter",
      label: "Emitter",
      toolbarSpacer: true,
      toolbarItem: (
        <EmitterDropdown
          emitters={emitters}
          selectedEmitter={selectedEmitter}
          onSelectedEmitterChange={onSelectedEmitterChange}
        />
      ),
      menuItem: (
        <>
          {emitters.map((emitter) => (
            <MenuItem
              key={emitter}
              icon={emitter === selectedEmitter ? <Checkmark16Regular /> : undefined}
              onClick={() => onSelectedEmitterChange(emitter)}
            >
              {emitter}
            </MenuItem>
          ))}
        </>
      ),
      overflowDivider: true,
    });

    if (documentationUrl) {
      result.push({
        id: "docs",
        label: "Documentation",
        icon: <BookOpen16Regular />,
        onClick: () => window.open(documentationUrl, "_blank"),
        toolbarSpacer: true,
        toolbarItem: (
          <label>
            <Link href={documentationUrl} target="_blank">
              Docs
            </Link>
          </label>
        ),
      });
    }

    if (externalItems && externalItems.length > 0) {
      const [first, ...rest] = externalItems;
      result.push({ ...first, toolbarDivider: first.toolbarDivider ?? true });
      result.push(...rest);
    }

    if (fileBug) {
      result.push({
        id: "file-bug",
        label: "File Bug",
        icon: <Bug16Regular />,
        onClick: handleFileBug,
      });
    }

    return result;
  }, [
    saveCode,
    formatCode,
    samples,
    onSelectedSampleNameChange,
    emitters,
    selectedEmitter,
    onSelectedEmitterChange,
    documentationUrl,
    externalItems,
    fileBug,
    handleFileBug,
  ]);

  const pinnedItems = items.filter((i) => i.pinned);
  const overflowItems = items.filter((i) => !i.pinned);

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
                      {overflowItems.map((item) => (
                        <Fragment key={item.id}>
                          <MenuItemRenderer item={item} />
                          {item.overflowDivider && <MenuDivider />}
                        </Fragment>
                      ))}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </>
            )}
          </>
        ) : (
          items.map((item) => (
            <Fragment key={item.id}>
              {item.toolbarSpacer && <div className={style["spacer"]} />}
              {item.toolbarDivider && <div className={style["divider"]} />}
              <ToolbarItemRenderer item={item} />
            </Fragment>
          ))
        )}
      </Toolbar>
      {isMobile && samples && (
        <SamplesDrawerOverlay
          samples={samples}
          onSelectedSampleNameChange={onSelectedSampleNameChange}
          open={samplesDrawerOpen}
          onOpenChange={setSamplesDrawerOpen}
        />
      )}
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
