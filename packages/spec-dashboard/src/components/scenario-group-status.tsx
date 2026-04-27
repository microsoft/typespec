import { FunctionComponent } from "react";
import { GroupRatioColors, GroupRatios } from "../constants.js";
import style from "./scenario-group-status.module.css";

export interface ScenarioGroupStatusRatioBoxProps {
  readonly ratio: number;
}

export const ScenarioGroupRatioStatusBox: FunctionComponent<ScenarioGroupStatusRatioBoxProps> = ({
  ratio,
}) => {
  let backgroundColor = GroupRatioColors.bad;

  for (const [key, expectedRatio] of Object.entries(GroupRatios)) {
    if (ratio >= expectedRatio) {
      backgroundColor = GroupRatioColors[key as keyof typeof GroupRatios];
      break;
    }
  }
  return (
    <div title="Pass" className={style["ratio-box"]} style={{ backgroundColor }}>
      {Math.floor(ratio * 100)}%
    </div>
  );
};
