import { FunctionComponent, useEffect, useRef, useState } from "react";
export interface SwaggerUIProps {
  spec: string;
}

export const SwaggerUI: FunctionComponent<SwaggerUIProps> = (props) => {
  const uiRef = useRef(null);
  const uiInstance = useRef<any>(null);
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
  // return <SwaggerUILib spec={props.spec} />;
};
