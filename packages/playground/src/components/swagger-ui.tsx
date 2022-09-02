import { FunctionComponent, useEffect, useRef, useState } from "react";

export interface SwaggerUIProps {
  spec: string;
}

export const SwaggerUI: FunctionComponent<SwaggerUIProps> = (props) => {
  const uiRef = useRef(null);
  const uiInstance = useRef<any>(null);
  const [swaggerUI, setSwaggerUILib] = useState<
    { createSwaggerUI: typeof import("swagger-ui") } | undefined
  >(undefined);
  useEffect(() => {
    void import("swagger-ui").then((lib) => {
      setSwaggerUILib({ createSwaggerUI: lib.default });
    });
  }, [setSwaggerUILib]);

  useEffect(() => {
    if (swaggerUI === undefined) {
      return;
    }
    if (uiInstance.current === null) {
      uiInstance.current = swaggerUI.createSwaggerUI({
        domNode: uiRef.current,
        spec: {},
      });
    }
    uiInstance.current.specActions.updateSpec(props.spec);
  }, [uiRef.current, swaggerUI, props.spec]);

  return <div className="swagger-ui-container" ref={uiRef}></div>;
};
