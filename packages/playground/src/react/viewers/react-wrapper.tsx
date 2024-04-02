import { useEffect, useRef } from "react";
import { SwaggerUIBundle } from "swagger-ui-dist";

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
