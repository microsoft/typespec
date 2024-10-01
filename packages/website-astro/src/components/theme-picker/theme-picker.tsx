import { WeatherMoon20Regular, WeatherSunny20Regular } from "@fluentui/react-icons";
import clsx from "clsx";
import { useColorMode } from "../docusaurus/core/theme-common";
import style from "./theme-picker.module.css";

export const ThemePicker = () => {
  const { colorMode, setColorMode } = useColorMode();

  return (
    <div className={style["theme-picker"]}>
      <div
        title="Light mode"
        className={clsx(style["theme-option"], { [style["selected"]]: colorMode === "light" })}
        onClick={() => setColorMode("light")}
      >
        <WeatherSunny20Regular />
      </div>
      <div
        title="Dark mode"
        className={clsx(style["theme-option"], { [style["selected"]]: colorMode === "dark" })}
        onClick={() => setColorMode("dark")}
      >
        <WeatherMoon20Regular />
      </div>
    </div>
  );
};
