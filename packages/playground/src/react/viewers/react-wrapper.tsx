import { useEffect, useRef } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import SwaggerUIBundle from "swagger-ui-dist/swagger-ui-es-bundle.js";

export default (props: { spec: string }) => {
  const uiRef = useRef(null);
  const uiInstance = useRef<any>(null);

  useEffect(() => {
    if (uiInstance.current === null) {
      uiInstance.current = SwaggerUIBundle({
        domNode: uiRef.current,
        spec: {},
      });
    }
    uiInstance.current.specActions.updateSpec(props.spec);
  }, [uiRef.current, props.spec]);

  return <div ref={uiRef}></div>;
};
