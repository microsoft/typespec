import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  Caption1,
  Combobox,
  Option,
  mergeClasses,
  type OptionOnSelectData,
} from "@fluentui/react-components";
import { DatabaseRegular } from "@fluentui/react-icons";
import { getDoc } from "@typespec/compiler";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Fragment } from "react/jsx-runtime";
import { useProgram } from "../program-context.js";
import { NodeIcon } from "../tree-navigation.js";
import { useTreeNavigator, type TypeGraphNode } from "../use-tree-navigation.js";
import style from "./current-path.module.css";

const rootIcon = <DatabaseRegular />;
export const CurrentPath = () => {
  const nav = useTreeNavigator();
  const segments = nav.selectedPath.split(".");
  const [showInput, setShowInput] = useState(false);

  useHotkeys("ctrl+shift+f, meta+shift+f", () => {
    setShowInput(true);
  });

  return (
    <div
      className={mergeClasses(style["current-path"], showInput && style["focus"])}
      onClick={() => setShowInput(true)}
    >
      <Breadcrumb size="small">
        <BreadcrumbItem>
          <BreadcrumbButton
            onClick={(evt) => {
              nav.selectPath("");
              evt.stopPropagation();
            }}
          >
            {rootIcon}
          </BreadcrumbButton>
        </BreadcrumbItem>
        {segments.length > 1 && <BreadcrumbDivider />}
        {showInput ? (
          <Search onBlur={() => setShowInput(false)} />
        ) : (
          <>
            {segments.slice(1).map((x, i) => {
              const last = i === segments.length - 2;
              return (
                <Fragment key={x}>
                  <BreadcrumbItem>
                    <BreadcrumbButton
                      current={last}
                      onClick={(evt) => {
                        if (!last) {
                          const newPath = segments.slice(0, i + 2).join(".");
                          nav.selectPath(newPath);
                          evt.stopPropagation();
                        }
                      }}
                    >
                      {x}
                    </BreadcrumbButton>
                  </BreadcrumbItem>
                  {!last && <BreadcrumbDivider />}
                </Fragment>
              );
            })}
            <span className={style["flex-gap"]} />
            <span className={style["search-placeholder"]}>Search (⌘+⇧+F)</span>
          </>
        )}
      </Breadcrumb>
    </div>
  );
};

interface SearchProps {
  onBlur: () => void;
}
const Search = ({ onBlur }: SearchProps) => {
  const nav = useTreeNavigator();

  const [search, setSearch] = useState(nav.selectedPath.slice(2));
  const options = findNodes(nav.tree, search);

  const selectOption = useCallback(
    (_: any, item: OptionOnSelectData) => {
      if (item.optionValue) {
        nav.selectPath(item.optionValue);
        setSearch(item.optionValue.slice(2));
      }
    },
    [nav],
  );

  return (
    <Combobox
      autoFocus
      size="small"
      className={style["breadcrumb-search"]}
      onFocus={(event) => event.target.select()}
      onBlur={onBlur}
      value={search}
      expandIcon={null}
      onChange={(evt) => setSearch(evt.target.value)}
      onOptionSelect={selectOption}
      open
    >
      {options.map((node) => (
        <SearchOption node={node} key={node.id} />
      ))}
    </Combobox>
  );
};

const SearchOption = ({ node }: { node: TypeGraphNode }) => {
  const program = useProgram();

  return (
    <Option
      key={node.id}
      value={node.id}
      text={node.name}
      checkIcon={<></>}
      className={style["option"]}
    >
      <NodeIcon node={node} />
      {node.name}
      {node.kind === "type" && (
        <>
          <span className={style["flex-gap"]} />
          <Caption1 className={style["doc"]}>{getDoc(program, node.type)}</Caption1>
        </>
      )}
    </Option>
  );
};
function findNodes(node: TypeGraphNode, search: string): TypeGraphNode[] {
  const searchSegments = search.toLowerCase().split(".");
  const [first, ...remaining] = searchSegments;
  const resultInChildren = node.children.flatMap((x) => findNodes(x, search));
  if (node.kind === "type" && node.name.toString().toLowerCase().includes(first)) {
    let current: TypeGraphNode | undefined = node;
    for (const segment of remaining) {
      if (current === undefined) {
        break;
      }
      current = current.children.find((x) => x.name.toString().toLowerCase().includes(segment));
    }
    return [...(current ? [current] : []), ...resultInChildren];
  }
  return resultInChildren;
}
