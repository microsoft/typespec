import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";

export interface FluentImgProps {
  name: FluentImageName;
  className?: string;
}

export type FluentImageName =
  | "chat"
  | "checkmark"
  | "design-layout"
  | "design"
  | "document-add"
  | "document-cloud"
  | "editor"
  | "eye-dev"
  | "firework"
  | "people-shield"
  | "shield-blue"
  | "shield-settings";

/**
 * Component for rendering a Fluent image.
 */
export const FluentImg = ({ name, ...props }: FluentImgProps) => {
  const { colorMode } = useColorMode();
  const colorKey = colorMode === "dark" ? "d" : "l";
  const src = useBaseUrl(`/img/fluent/${name}-${colorKey}-standard-128x128.png`);
  return <img src={src} {...props} />;
};
