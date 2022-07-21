import { FunctionComponent, useCallback, useState } from "react";
import { OutputEditor } from "./cadl-editor";
import { SwaggerUI } from "./swagger-ui";
export interface OpenAPIOutputProps {
  content: string;
}

export const OpenAPIOutput: FunctionComponent<OpenAPIOutputProps> = (props)=> {
  const[selected, setSelected] = useState<"raw"|"swagger-ui">("raw");
  const handleSelected = useCallback(
    () => { return setSelected(selected === "raw"?("swagger-ui"):("raw")); },
    [selected],
  );
  return(
    <>
    <select className="output-dropdown" onChange={handleSelected}>
      <option>OpenApi</option>
      <option >Swagger-UI</option>
    </select>
    {selected === "raw"? (<OutputEditor value={props.content}/>):(<SwaggerUI spec={props.content} />)}
    </>);
}

