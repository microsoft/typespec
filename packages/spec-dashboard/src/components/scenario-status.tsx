import { mergeClasses } from "@fluentui/react-components";
import {
  Checkmark20Filled,
  ErrorCircle20Filled,
  QuestionCircle20Filled,
  SpeakerMute20Filled,
  Warning20Filled,
} from "@fluentui/react-icons";
import { ScenarioStatus } from "@typespec/spec-coverage-sdk";
import { FunctionComponent } from "react";
import style from "./scenario-status.module.css";

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

export const PassStatus = () => (
  <div title="Pass" className={mergeClasses(style["status-box"], style["pass"])}>
    <Checkmark20Filled />
  </div>
);

export const FailStatus = () => (
  <div title="Fail" className={mergeClasses(style["status-box"], style["fail"])}>
    <ErrorCircle20Filled />
  </div>
);

export const NotSupportedStatus = () => (
  <div title="Not supported" className={mergeClasses(style["status-box"], style["not-supported"])}>
    <SpeakerMute20Filled />
  </div>
);
export const NotApplicableStatus = () => (
  <div
    title="Not applicable"
    className={mergeClasses(style["status-box"], style["not-applicable"])}
  >
    <SpeakerMute20Filled />
  </div>
);

export const NotImplementedStatus = () => (
  <div
    title="Not implemented"
    className={mergeClasses(style["status-box"], style["not-implemented"])}
  >
    <Warning20Filled />
  </div>
);

export const NotReportedStatus = () => (
  <div title="Not reported" className={mergeClasses(style["status-box"], style["not-reported"])}>
    <QuestionCircle20Filled />
  </div>
);
