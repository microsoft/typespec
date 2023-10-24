import interoperateTsp from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/main.tsp";
import interoperateOpenapi from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/openapi.yaml";
import interoperateSpectral from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/spectral.txt";
import { Painter } from "@site/src/components/painter/painter";
import { AssetImg } from "../../components/asset-img/asset-img";
import { CodeBlock } from "../../components/code-block/code-block";
import {
  WindowCarousel,
  WindowCarouselItem,
} from "../../components/window-carousel/window-carousel";
import style from "./interoperate-illustration.module.css";

export const OpenAPI3InteroperateIllustration = () => {
  return (
    <WindowCarousel>
      <WindowCarouselItem value="TypeSpec">
        <div className={style["illustration-main"]}>
          <div className={style["tsp"]}>
            <CodeBlock language="tsp">{interoperateTsp}</CodeBlock>
          </div>
          <div className={style["openapi"]}>
            <CodeBlock language="yaml">{interoperateOpenapi}</CodeBlock>
          </div>
          <div className={style["spectral"]}>
            <CodeBlock language="shell-session">
              <Painter content={interoperateSpectral} />
            </CodeBlock>
          </div>
        </div>
      </WindowCarouselItem>
      <WindowCarouselItem value="Swagger UI">
        <AssetImg className={style["swagger-ui"]} src="illustrations/swagger-ui.png" />
      </WindowCarouselItem>
    </WindowCarousel>
  );
};
