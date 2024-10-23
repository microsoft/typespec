import interoperateTsp from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/main.tsp";
import interoperateOpenapi from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/openapi.yaml";
import interoperateSpectral from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/spectral.txt";
import { Painter } from "@site/src/components/painter/painter";
import { Terminal } from "@site/src/components/terminal/terminal";
import { AssetImg } from "../asset-img/asset-img";
import { CodeBlock } from "../code-block/code-block";
import { WindowCarousel, WindowCarouselItem } from "../window-carousel/window-carousel";
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
          <Terminal className={style["spectral"]} hideHeader>
            <Painter content={interoperateSpectral} />
          </Terminal>
        </div>
      </WindowCarouselItem>
      <WindowCarouselItem value="Swagger UI">
        <AssetImg className={style["swagger-ui"]} src="illustrations/swagger-ui.png" />
      </WindowCarouselItem>
    </WindowCarousel>
  );
};
