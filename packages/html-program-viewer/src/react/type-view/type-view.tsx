import {
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  Text,
  tokens,
  Tooltip,
} from "@fluentui/react-components";
import { BookmarkFilled, BookmarkRegular } from "@fluentui/react-icons";
import { getDoc } from "@typespec/compiler";
import { useEffect, useState } from "react";
import { Mono, TypeKindTag } from "../common.js";
import { InspectType } from "../inspect-type/inspect-type.js";
import { TypeDataTable } from "../inspect-type/type-data-table.js";
import { useProgram } from "../program-context.js";
import type { TreeNavigator, TypeGraphTypeNode } from "../use-tree-navigation.js";
import style from "./type-view.module.css";

declare global {
  interface Window {
    vars?: Record<string, unknown>;
  }
}

export interface TypeNodeViewProps {
  readonly nav: TreeNavigator;
  readonly node: TypeGraphTypeNode;
}

export const TypeNodeView = ({ node }: TypeNodeViewProps) => {
  const program = useProgram();

  const [isVarSet, setIsVarSet] = useState(() => Boolean(window.vars?.[node.name]));

  const handleSaveType = () => setIsVarSet((x) => !x);

  useEffect(() => {
    if (isVarSet) {
      if (!window.vars) window.vars = {};
      window.vars[node.name] = node.type;
    } else {
      if (window.vars) {
        delete window.vars[node.name];
      }
    }
  }, [node.name, node.type, isVarSet]);

  return (
    <div className={style["type-view"]}>
      <Card className={style["main"]}>
        <CardHeader
          className={style["header-section"]}
          header={
            <div className={style["header"]}>
              <div className={style["header-left"]}>
                <TypeKindTag type={node.type} />
                <Text weight="semibold" size={500}>
                  <Mono>{node.name}</Mono>
                </Text>
              </div>
              <div className={style["header-spacer"]}></div>
              <Tooltip content={`Save as vars.${node.name}`} relationship="label">
                <Button
                  icon={
                    isVarSet ? (
                      <BookmarkFilled style={{ color: tokens.colorBrandBackground }} />
                    ) : (
                      <BookmarkRegular />
                    )
                  }
                  onClick={handleSaveType}
                  size="small"
                  appearance="subtle"
                />
              </Tooltip>
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
