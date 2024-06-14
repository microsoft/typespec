import {
  FluentProvider,
  Tree,
  TreeItem,
  TreeItemLayout,
  webLightTheme,
} from "@fluentui/react-components";
import type { Namespace, Program, Type } from "@typespec/compiler";
import { getNamespaceFullName } from "@typespec/compiler";
import { type FunctionComponent } from "react";
import ReactDOMServer from "react-dom/server";
import { ProgramProvider, useProgram } from "./program-context.js";
import style from "./tree-navigation.module.css";

function expandNamespaces(namespace: Namespace): Namespace[] {
  return [namespace, ...[...namespace.namespaces.values()].flatMap(expandNamespaces)];
}

export function renderProgram(program: Program) {
  const html = ReactDOMServer.renderToString(
    <FluentProvider theme={webLightTheme}>
      <TypeGraph program={program} />
    </FluentProvider>
  );
  return html;
}

export interface TypeGraphProps {
  readonly program: Program;
}

export const TypeGraph: FunctionComponent<TypeGraphProps> = ({ program }) => {
  return (
    <ProgramProvider value={program}>
      <TreeNavigation />
    </ProgramProvider>
  );
};

const TreeNavigation = () => {
  const program = useProgram();
  const root = program.checker!.getGlobalNamespaceType();
  const namespaces = expandNamespaces(root);

  return (
    <Tree size="small" aria-label="Type graph navigation" className={style["tree-navigation"]}>
      {namespaces.map((namespace) => (
        <NamespaceTreeNode key={getNamespaceFullName(namespace)} namespace={namespace} />
      ))}
    </Tree>
  );
};

const NamespaceTreeNode = ({ namespace }: { namespace: Namespace }) => {
  const id = getNamespaceFullName(namespace);
  return <EntityTreeNode path="id" type={namespace} name={id || "(global)"} />;
};

type NamedType = Type & { name: string };
type EntityTreeNodeProps<T extends NamedType> = {
  readonly path: string;
  readonly type: T;
  readonly name?: string;
};

const omittedProps = [
  "entityKind",
  "kind",
  "name",
  "node",
  "symbol",
  "namespace",
  "templateNode",
  "templateArguments",
  "templateMapper",
  "instantiationParameters",
  "decorators",
  "projectionBase",
  "projectionsByName",
  "projectionSource",
  "projector",
  "projections",
  "isFinished",
] as const;
const omittedPropsSet = new Set(omittedProps);

interface Prop {
  name: string;
  value: Map<string, NamedType>;
  description?: string;
}

const EntityTreeNode = <T extends NamedType>({ path, type, name }: EntityTreeNodeProps<T>) => {
  name ??= type.name;
  const typeRendering = (TypeRendering as any)[type.kind];
  const props: Prop[] = Object.entries(type)
    .map(([key, value]) => {
      if (omittedPropsSet.has(key as any)) {
        return undefined;
      }
      const action: PropertyAction | undefined = typeRendering?.[key] as PropertyAction;
      if (action !== "nested") {
        return undefined;
      }

      return {
        name: key,
        value: value,
      } satisfies Prop;
    })
    .filter((x): x is Prop => Boolean(x));
  return (
    <TreeItem itemType={props.length === 0 ? "leaf" : "branch"}>
      <TreeItemLayout>{name}</TreeItemLayout>
      {props.length > 0 && (
        <Tree defaultOpenItems={props.map((x) => path + "." + x.name)}>
          {props.map((x) => {
            const propPath = path + "." + x.name;
            return <EntityPropTreeNode key={x.name} path={propPath} prop={x} />;
          })}
        </Tree>
      )}
    </TreeItem>
  );
};

interface EntityPropTreeNode {
  path: string;
  prop: Prop;
}
const EntityPropTreeNode = ({ path, prop }: EntityPropTreeNode) => {
  const empty = prop.value.size === 0;
  return (
    <TreeItem itemType={empty ? "leaf" : "branch"} key={prop.name} value={path}>
      <TreeItemLayout title={prop.description}>
        {prop.name} {empty ? "(0)" : ""}
      </TreeItemLayout>
      <ItemListTree path={path} items={prop.value} />
    </TreeItem>
  );
};

const ItemListTree = ({ path, items }: { path: string; items: Map<string, NamedType> }) => {
  return (
    <Tree>
      {Array.from(items.entries()).map(([key, value]) => {
        return <EntityTreeNode path={path} type={value} />;
      })}
    </Tree>
  );
};

type PropertyAction = "skip" | "ref" | "nested" | "value";

const TypeRendering = {
  Namespace: {
    namespaces: "skip",
    models: "nested",
    scalars: "nested",
    interfaces: "nested",
    operations: "nested",
    unions: "nested",
    enums: "nested",
    decoratorDeclarations: "nested",
    functionDeclarations: "nested",
  },
  Interace: {
    operations: "nested",
    sourceInterfaces: "ref",
  },
  Operation: {
    interface: "skip",
    parameters: "nested",
    returnType: "ref",
    sourceOperation: "ref",
  },
  Model: {
    indexer: "skip",
    baseModel: "ref",
    derivedModels: "ref",
    properties: "nested",
    sourceModel: "ref",
    sourceModels: "value",
  },
};
