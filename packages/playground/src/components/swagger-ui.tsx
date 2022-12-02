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
      setSwaggerUILib({ swaggerUIComp: lib.default });
    });
  }, [setSwaggerUILib]);

  if (swaggerUI === undefined) {
    return null;
  }
  return <swaggerUI.swaggerUIComp spec={props.spec} />;
};
