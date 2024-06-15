import { Card, CardHeader, Text } from "@fluentui/react-components";
import { List, ListItem } from "@fluentui/react-list-preview";
import { useCallback } from "react";
import type { TreeNavigator, TypeGraphListNode, TypeGraphNode } from "./use-tree-navigation.js";

export interface ListNodeViewProps {
  readonly nav: TreeNavigator;
  readonly node: TypeGraphListNode;
}
export const ListNodeView = ({ nav, node }: ListNodeViewProps) => {
  return (
    <Card>
      <CardHeader
        header={
          <Text weight="semibold" size={600}>
            {node.name}
          </Text>
        }
      ></CardHeader>
      <List navigationMode="items">
        {node.children.map((item) => (
          <Item item={item} nav={nav} />
        ))}

        {node.children.length === 0 && <ListItem>No items</ListItem>}
      </List>
    </Card>
  );
};

const Item = ({ item, nav }: { nav: TreeNavigator; item: TypeGraphNode }) => {
  const select = useCallback(() => {
    nav.selectPath(item.id);
  }, [nav.selectPath]);
  return (
    <ListItem key={item.id} onAction={select}>
      {item.name}
    </ListItem>
  );
};
