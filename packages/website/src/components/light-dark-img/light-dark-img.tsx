import { AssetImg } from "../asset-img/asset-img";
import style from "./light-dark-img.module.css";

export const LightDarkImg = ({ src }: { src: string }) => {
  return (
    <div>
      <AssetImg className={style["dark"]} src={`${src}.dark.png`} alt={src} />
      <AssetImg className={style["light"]} src={`${src}.light.png`} alt={src} />
    </div>
  );
};
