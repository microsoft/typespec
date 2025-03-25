import { Card, CardHeader, Text } from "@fluentui/react-components";
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

        {node.children.length === 0 && <ListItem>No items</ListItem>}
      </List>
    </Card>
  );
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
