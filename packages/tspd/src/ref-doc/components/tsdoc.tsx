import { mapJoin } from "@alloy-js/core";
import {
  DocNodeKind,
  DocNodeTransforms,
  DocPlainText,
  DocSection,
  type DocNode,
  type DocParagraph,
} from "@microsoft/tsdoc";

export interface TSDocProps {
  readonly node: DocNode;
}

export function TsDoc(props: TSDocProps) {
  switch (props.node.kind) {
    case DocNodeKind.Paragraph:
      return <TsDocParagraph node={props.node as DocParagraph} />;
    case DocNodeKind.Section:
      return <TsDocSection node={props.node as DocSection} />;
    case DocNodeKind.PlainText:
      return <TsDocPlainText node={props.node as DocPlainText} />;
    default:
      return props.node.kind;
  }
}

export interface TsDocParagraphProps {
  node: DocParagraph;
}
export function TsDocParagraph(props: TsDocParagraphProps) {
  const trimmed = DocNodeTransforms.trimSpacesInParagraph(props.node);
  let contentStartIndex = 0;
  while (
    contentStartIndex < trimmed.nodes.length &&
    trimmed.nodes[contentStartIndex].kind === DocNodeKind.SoftBreak
  ) {
    contentStartIndex++;
  }

  return trimmed.nodes.slice(contentStartIndex).map((node) => TsDoc({ node }));
}

export interface TsDocPlainTextProps {
  node: DocPlainText;
}
export function TsDocPlainText(props: TsDocPlainTextProps) {
  return props.node.text;
}

export interface TsDocSectionProps {
  node: DocSection;
}
export function TsDocSection(props: TsDocSectionProps) {
  return mapJoin(
    () => props.node.nodes as DocNode[],
    (node) => <TsDoc node={node} />,
    {
      joiner: "\n\n",
    },
  );
}
