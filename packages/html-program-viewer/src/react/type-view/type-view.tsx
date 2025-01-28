import { Caption1, Card, CardHeader, Divider, Text } from "@fluentui/react-components";
import { getDoc } from "@typespec/compiler";
import { Mono, TypeKindTag } from "../common.js";
import { InspectType } from "../inspect-type/inspect-type.js";
import { TypeDataTable } from "../inspect-type/type-data-table.js";
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
      <Card className={style["main"]}>
        <CardHeader
          className={style["header-section"]}
          header={
            <div className={style["header"]}>
              <TypeKindTag type={node.type} />
              <Text weight="semibold" size={500}>
                <Mono>{node.name}</Mono>
              </Text>
            </div>
          }
          description={<Caption1 className={style["doc"]}>{getDoc(program, node.type)}</Caption1>}
        />
        <Divider className={style["divider"]} />

        <div className={style["inspect-section"]}>
          <InspectType entity={node.type} />
        </div>
      </Card>

      <Card>
        <CardHeader header={<Text weight="semibold">Type data</Text>} />
        <TypeDataTable type={node.type} />
      </Card>
    </div>
  );
};
