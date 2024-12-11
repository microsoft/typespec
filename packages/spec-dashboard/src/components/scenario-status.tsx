import { css } from "@emotion/react";
import {
  Checkmark20Filled,
  ErrorCircle20Filled,
  QuestionCircle20Filled,
  SpeakerMute20Filled,
  Warning20Filled,
} from "@fluentui/react-icons";
import { ScenarioStatus } from "@typespec/spec-coverage-sdk";
import { FunctionComponent } from "react";
import { Colors, ScenarioStatusColors } from "../constants.js";

export interface ScenarioStatusBoxProps {
  readonly status: ScenarioStatus | undefined;
}

export const ScenarioStatusBox: FunctionComponent<ScenarioStatusBoxProps> = ({ status }) => {
  switch (status) {
    case "pass":
      return <PassStatus />;
    case "fail":
      return <FailStatus />;
    case "not-applicable":
      return <NotApplicableStatus />;
    case "not-supported":
      return <NotSupportedStatus />;
    case "not-implemented":
      return <NotImplementedStatus />;
    case undefined: {
      return <NotReportedStatus />;
    }
    default:
      return <div>Unexpected value {status}</div>;
  }
};

const ScenarioStatusBoxStyles = css({
  height: "100%",
  width: "100%",
  color: Colors.bgSubtle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const PassStatus = () => (
  <div
    title="Pass"
    css={[ScenarioStatusBoxStyles, css({ backgroundColor: ScenarioStatusColors.pass })]}
  >
    <Checkmark20Filled />
  </div>
);

export const FailStatus = () => (
  <div
    title="Fail"
    css={[ScenarioStatusBoxStyles, css({ backgroundColor: ScenarioStatusColors.fail })]}
  >
    <ErrorCircle20Filled />
  </div>
);

export const NotSupportedStatus = () => (
  <div
    title="Not supported"
    css={[ScenarioStatusBoxStyles, css({ backgroundColor: ScenarioStatusColors.notSupported })]}
  >
    <SpeakerMute20Filled />
  </div>
);
export const NotApplicableStatus = () => (
  <div
    title="Not applicable"
    css={[ScenarioStatusBoxStyles, css({ backgroundColor: ScenarioStatusColors.notApplicable })]}
  >
    <SpeakerMute20Filled />
  </div>
);

export const NotImplementedStatus = () => (
  <div
    title="Not implemented"
    css={[ScenarioStatusBoxStyles, css({ backgroundColor: ScenarioStatusColors.notImplemented })]}
  >
    <Warning20Filled />
  </div>
);

export const NotReportedStatus = () => (
  <div
    title="Not reported"
    css={[ScenarioStatusBoxStyles, css({ backgroundColor: ScenarioStatusColors.notReported })]}
  >
    <QuestionCircle20Filled />
  </div>
);
