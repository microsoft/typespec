import { ToggleButton, Tooltip } from "@fluentui/react-components";
import { AppsListRegular, LibraryFilled, LibraryRegular } from "@fluentui/react-icons";
import { Tree } from "@typespec/react-components";
import style from "./tree-navigation.module.css";
import { useTreeNavigator, type TypeGraphNode } from "./use-tree-navigation.js";

export interface TreeNavigationProps {}

export const TreeNavigation = (_: TreeNavigationProps) => {
  const nav = useTreeNavigator();
  const showLibraries = !nav.onlyProjectCode;

  return (
    <div className={style["tree-navigation"]}>
      <div className={style["toolbar"]}>
        <div className={style["toolbar-title"]}>Types</div>
        <Tooltip
          content={
            showLibraries
              ? "Hide the types coming from the compiler standard library and the loaded libraries"
              : "Show the types coming from the compiler standard library and the loaded libraries"
          }
          relationship="label"
        >
          <ToggleButton
            className={style["toolbar-action"]}
            appearance="subtle"
            size="small"
            checked={showLibraries}
            icon={showLibraries ? <LibraryFilled /> : <LibraryRegular />}
            onClick={() => nav.setOnlyProjectCode(showLibraries)}
          />
        </Tooltip>
      </div>
      <div className={style["tree-container"]}>
        <Tree<TypeGraphNode>
          selectionMode="single"
          tree={nav.tree}
          nodeIcon={NodeIcon}
          selected={nav.selectedPath}
          onSelect={nav.selectPath}
        />
      </div>
    </div>
  );
};

export const NodeIcon = ({ node }: { node: TypeGraphNode }) => {
  switch (node.kind) {
    case "type": {
      const kindPrefix = node.type?.kind?.[0] ?? "?";
      return <span className={style["type-kind-icon"]}>{kindPrefix}</span>;
    }
    case "list":
      return <AppsListRegular />;
  }
};
