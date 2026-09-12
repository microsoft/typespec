import { Button, Card, CardHeader, Text } from "@fluentui/react-components";
import { List, ListItem } from "@fluentui/react-list";
import { useCallback } from "react";
import type { TreeNavigator, TypeGraphListNode, TypeGraphNode } from "../use-tree-navigation.js";
import style from "./list-type-view.module.css";

export interface ListTypeViewProps {
  readonly nav: TreeNavigator;
  readonly node: TypeGraphListNode;
}
export const ListTypeView = ({ nav, node }: ListTypeViewProps) => {
  return (
    <Card>
      <CardHeader
        header={
          <Text weight="semibold" size={600}>
            {node.name}
          </Text>
        }
      />
      <List navigationMode="items">
        {node.children.map((item) => (
          <Item key={item.id} item={item} nav={nav} />
        ))}

        {node.children.length === 0 && (
          <ListItem>
            <EmptyList nav={nav} node={node} />
          </ListItem>
        )}
      </List>
    </Card>
  );
};

const EmptyList = ({ nav, node }: ListTypeViewProps) => {
  if (nav.onlyProjectCode && node === nav.tree) {
    return (
      <span className={style["empty"]}>
        No types declared in your code.
        <Button appearance="transparent" size="small" onClick={() => nav.setOnlyProjectCode(false)}>
          Show everything
        </Button>
      </span>
    );
  }
  return <>No items</>;
};

const Item = ({ item, nav }: { nav: TreeNavigator; item: TypeGraphNode }) => {
  const select = useCallback(() => {
    nav.selectPath(item.id);
  }, [item.id, nav]);
  return (
    <ListItem onAction={select} className={style["item"]}>
      {item.name}
    </ListItem>
  );
};
