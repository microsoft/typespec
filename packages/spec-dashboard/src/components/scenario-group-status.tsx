import { SerializedStyles, css } from "@emotion/react";
import { FunctionComponent } from "react";
import { Colors, GroupRatioColors, GroupRatios } from "../constants.js";

export interface ScenarioGroupStatusRatioBoxProps {
  readonly ratio: number;
}

export const ScenarioGroupRatioStatusBox: FunctionComponent<ScenarioGroupStatusRatioBoxProps> = ({
  ratio,
}) => {
  let css = groupRatioStyles.bad;

  for (const [key, expectedRatio] of Object.entries(GroupRatios)) {
    if (ratio >= expectedRatio) {
      css = groupRatioStyles[key as keyof typeof GroupRatios];
      break;
    }
  }
  return (
    <div
      title="Pass"
      css={[
        {
          height: "100%",
          width: "100%",
          display: "flex",
          color: Colors.bgSubtle,
          alignItems: "center",
          justifyContent: "center",
        },
        css,
      ]}
    >
      {Math.floor(ratio * 100)}%
    </div>
  );
};

const groupRatioStyles: Record<keyof typeof GroupRatios, SerializedStyles> = Object.fromEntries(
  Object.entries(GroupRatioColors).map(([key, value]) => {
    return [key, css({ backgroundColor: value })];
  }),
) as any;
