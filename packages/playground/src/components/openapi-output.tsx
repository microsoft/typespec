import { css } from "@emotion/react";
import { FunctionComponent, useCallback, useState } from "react";
import { PlaygroundManifest } from "../manifest";
import { OutputEditor } from "./cadl-editor";
import { SwaggerUI } from "./swagger-ui";
export interface OpenAPIOutputProps {
  filename: string;
  content: string;
}

export const OpenAPIOutput: FunctionComponent<OpenAPIOutputProps> = (props) => {
  const [selected, setSelected] = useState<"raw" | "swagger-ui">("raw");
  const options = [
    { label: "Open API", value: "raw" },
    { label: "Swagger UI", value: "swagger-ui" },
  ];

  const handleSelected = useCallback(
    (event: any) => {
      setSelected(event.target.value);
    },
    [selected]
  );

  return (
    <div css={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {PlaygroundManifest.enableSwaggerUI ? (
        <select css={DropdownStyle} onChange={handleSelected} value={selected}>
          {options.map((item) => {
            return (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            );
          })}
        </select>
      ) : (
        <></>
      )}

      {selected === "raw" ? (
        <OutputEditor filename={props.filename} value={props.content} />
      ) : (
        <SwaggerUI spec={props.content} />
      )}
    </div>
  );
};

const DropdownStyle = css({
  margin: "0.5rem 1.5rem",
  position: "absolute",
  "z-index": 1,
  right: 0,
});
