import { Caption1, Card, CardHeader, Text } from "@fluentui/react-components";
import { getDoc } from "@typespec/compiler";
import { Mono, TypeKind } from "../common.js";
import { InspectType, TypeData } from "../inspect-type/ui.js";
import { useProgram } from "../program-context.js";
import type { TreeNavigator, TypeGraphTypeNode } from "../use-tree-navigation.js";
import style from "./type-view.module.css";

export interface TypeNodeViewProps {
  readonly nav: TreeNavigator;
  readonly node: TypeGraphTypeNode;
}

export const TypeNodeView = ({ node }: TypeNodeViewProps) => {
  const program = useProgram();

  return (
    <div className={style["type-view"]}>
      <Card>
        <CardHeader
          header={
            <div className={style["header"]}>
              <TypeKind type={node.type} />
              <Text weight="semibold" size={500}>
                <Mono>{node.name}</Mono>
              </Text>
            </div>
          }
          description={<Caption1>{getDoc(program, node.type)}</Caption1>}
        />
        <InspectType entity={node.type} />
      </Card>

      <Card>
        <CardHeader header={<Text weight="semibold">Type data</Text>} />
        <TypeData type={node.type} />
      </Card>
    </div>
  );
};
