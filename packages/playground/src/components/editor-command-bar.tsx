import { css } from "@emotion/react";
import { FunctionComponent } from "react";
import { SamplesDropdown } from "./samples-dropdown.js";

export interface EditorCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  updateCadl: (value: string) => Promise<void> | void;
  newIssue: () => Promise<void> | void;
}
export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = ({
  documentationUrl,
  saveCode,
  updateCadl,
  newIssue,
}) => {
  const documentation = documentationUrl ? (
    <label>
      <a href={documentationUrl} target="_blank">
        Documentation
      </a>
    </label>
  ) : undefined;
  return (
    <div css={{ borderBottom: "1px solid #f5f5f5" }}>
      <label css={CommandItemStyles}>
        <button onClick={saveCode as any}>Share</button>
      </label>
      <label css={CommandItemStyles}>
        {"Load a sample: "}
        <SamplesDropdown onSelectSample={updateCadl as any} />
      </label>
      <label css={CommandItemStyles}>
        <button onClick={newIssue as any}>Open Issue</button>
      </label>
      {documentation}
    </div>
  );
};

const CommandItemStyles = css({
  padding: "0 2px",
});
