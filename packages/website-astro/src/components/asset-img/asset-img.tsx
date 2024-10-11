import useBaseUrl from "@docusaurus/useBaseUrl";
import style from "./asset-img.module.css";

export interface AssetImgProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Component for rendering an image resolving the relative path.
 */
export const AssetImg = ({ src, ...props }: AssetImgProps) => {
  const fullSrc = useBaseUrl(`/img/${src}`);
  return <img className={style["img"]} src={fullSrc} {...props} alt={props.alt ?? ""} />;
};
