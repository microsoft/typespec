import { FunctionComponent } from "react";
import { SamplesDropdown } from "./samples-dropdown";

export interface EditorCommandBarProps {
  saveCode: () => Promise<void> | void;
  updateCadl: (value: string) => Promise<void> | void;
  newIssue: () => Promise<void> | void;
}
export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = ({
  saveCode,
  updateCadl,
  newIssue,
}) => {
  return (
    <div css={{ borderBottom: "1px solid #f5f5f5" }}>
      <label>
        <button onClick={saveCode as any}>Share</button>
      </label>
      <label>
        {"Load a sample: "}
        <SamplesDropdown onSelectSample={updateCadl as any} />
      </label>
      <label>
        <button onClick={newIssue as any}>Open Issue</button>
      </label>
      <label>
        <a href="https://microsoft.github.io/cadl" target="_blank">
          Show Cadl Docs
        </a>
      </label>
    </div>
  );
};
