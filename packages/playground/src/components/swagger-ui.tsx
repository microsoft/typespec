import { FunctionComponent, useEffect, useState } from "react";

export interface SwaggerUIProps {
  spec: string;
}

export const SwaggerUI: FunctionComponent<SwaggerUIProps> = (props) => {
  const [swaggerUI, setSwaggerUILib] = useState<
    { swaggerUIComp: typeof import("swagger-ui-react").default } | undefined
  >(undefined);
  useEffect(() => {
    void import("swagger-ui-react").then((lib) => {
      setSwaggerUILib({ swaggerUIComp: lib.default as any });
    });
  }, [setSwaggerUILib]);

  if (swaggerUI === undefined) {
    return null;
  }
  return (
    <div
      css={{
        width: "100%",
        height: "100%",
        overflow: "auto",
      }}
    >
      <swaggerUI.swaggerUIComp spec={props.spec} />
    </div>
  );
};
