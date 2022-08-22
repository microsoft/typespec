import { FunctionComponent, useCallback, useState } from "react";
import { PlaygroundManifest } from "../manifest";
import { OutputEditor } from "./cadl-editor";
import { SwaggerUI } from "./swagger-ui";
export interface OpenAPIOutputProps {
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
    <>
      {PlaygroundManifest.enableSwaggerUI ? (
        <select className="output-dropdown" onChange={handleSelected} value={selected}>
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
        <OutputEditor value={props.content} />
      ) : (
        <SwaggerUI spec={props.content} />
      )}
    </>
  );
};
