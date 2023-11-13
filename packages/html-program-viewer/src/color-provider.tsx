import { FunctionComponent, ReactNode, useMemo } from "react";
import { ColorPalette, ColorVariable, ColorsVariables } from "./constants.js";

export interface ColorProviderProps {
  colors: Partial<ColorPalette>;
  children?: ReactNode;
}

export const ColorProvider: FunctionComponent<ColorProviderProps> = ({ children, colors }) => {
  const cssVariables = useMemo(() => {
    const colorArray: [ColorVariable, string][] = Object.entries(colors) as any;
    return Object.fromEntries(
      colorArray.map(([key, value]) => {
        return [ColorsVariables[key], value];
      })
    );
  }, [colors]);
  return <div style={cssVariables}>{children}</div>;
};
