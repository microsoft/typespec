import { Badge, Tooltip } from "@fluentui/react-components";
import { BookRegular, CodeRegular, PersonRegular } from "@fluentui/react-icons";
import {
  getBaseFileName,
  getLocationContext,
  getSourceLocation,
  type Program,
  type Type,
} from "@typespec/compiler";
import type { ReactElement } from "react";
import { useRevealSource } from "../reveal-source-context.js";
import style from "./type-origin.module.css";

export interface TypeOriginProps {
  readonly program: Program;
  readonly type: Type;
}

/** Show where a type was declared: the user project, the compiler standard library or a library. */
export const TypeOrigin = ({ program, type }: TypeOriginProps) => {
  const revealSource = useRevealSource();
  const context = getLocationContext(program, type);
  const location = getSourceLocation(type);
  const position = location.isSynthetic
    ? undefined
    : location.file.getLineAndCharacterOfPosition(location.pos);

  const { icon, label } = describeLocationContext(context);
  const path = location.isSynthetic ? undefined : location.file.path;
  const locationLabel =
    path === undefined
      ? "This type was not declared in a file"
      : `${path}${position ? `:${position.line + 1}:${position.character + 1}` : ""}`;

  // Only the types declared in the user code can be revealed, the host is not expected to show the library files.
  const canReveal = revealSource !== undefined && path !== undefined && context.type === "project";

  const badge = (
    <Badge className={style["origin"]} appearance="outline" color="informative" icon={icon}>
      {label}
      {path && position && (
        <span className={style["position"]}>
          {getDisplayPath(path)}:{position.line + 1}
        </span>
      )}
    </Badge>
  );

  if (canReveal) {
    return (
      <Tooltip content={`Reveal in editor: ${locationLabel}`} relationship="label">
        <button type="button" className={style["reveal"]} onClick={() => revealSource(type)}>
          {badge}
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={locationLabel} relationship="label">
      {badge}
    </Tooltip>
  );
};

/**
 * Path to show next to the origin. Files coming from a package are shown relative to the package root, others are shown with their file name only.
 */
export function getDisplayPath(path: string): string {
  const marker = "/node_modules/";
  const index = path.lastIndexOf(marker);
  if (index === -1) {
    return getBaseFileName(path);
  }
  const relative = path.slice(index + marker.length);
  const segments = relative.split("/");
  // Drop the package name(`@scope/name` or `name`) to keep the path relative to the package root.
  return segments.slice(segments[0].startsWith("@") ? 2 : 1).join("/");
}

function describeLocationContext(context: ReturnType<typeof getLocationContext>): {
  icon: ReactElement;
  label: string;
} {
  switch (context.type) {
    case "project":
      return { icon: <PersonRegular />, label: "Your code" };
    case "compiler":
      return { icon: <CodeRegular />, label: "Standard library" };
    case "library":
      return { icon: <BookRegular />, label: context.metadata.name };
    case "synthetic":
      return { icon: <CodeRegular />, label: "Synthetic" };
  }
}
