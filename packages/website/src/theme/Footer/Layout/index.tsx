import { useColorMode } from "@docusaurus/theme-common";
import { WeatherMoon20Regular, WeatherSunny20Regular } from "@fluentui/react-icons";
import { Link } from "@site/src/components/link/link";
import { Links } from "@site/src/constants";
import clsx from "clsx";
import style from "./index.module.css";

export default function FooterLayout({ style: theme, links, copyright }) {
  return (
    <footer
      className={clsx(style["footer"], {
        "footer--dark": theme === "dark",
      })}
      data-theme="dark"
    >
      <div className={style["top"]}>
        <div className={style["main"]}>
          <div className={style["main-title"]}>TypeSpec</div>
          <div className={style["main-description"]}>
            Follow us for latest updates, contributions, and more.
          </div>
          <div>
            <a
              href="https://github.com/microsoft/typespec"
              target="_blank"
              rel="noopener noreferrer"
              className="header-github-link"
              aria-label="Github repository"
            ></a>
          </div>
        </div>
        <div className={style["top-separator"]}></div>
        <div className={style["links"]}>{links}</div>
        <div>
          <ThemePicker />
        </div>
      </div>
      <div className={style["separator"]}></div>
      <div className={style["bottom"]}>
        <div className={style["logo-copyright"]}>
          <div className={style["logo"]}>
            <MicrosoftLogo />
            Microsoft
          </div>
          <div>{copyright}</div>
        </div>
        <div className={style["general-links"]}>
          <div>
            <Link href={Links.privacy} title="Microsoft Privacy Policy">
              Privacy
            </Link>
          </div>
          <div>
            <Link href={Links.termsOfUse} title="Microsoft Terms Of Use">
              Terms of use
            </Link>
          </div>
          <div>
            <Link href={Links.trademark} title="Microsoft Trademarks">
              Trademarks
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const MicrosoftLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
  >
    <path d="M7.66683 1.33325H1.3335V7.66659H7.66683V1.33325Z" />
    <path d="M14.6668 1.33325H8.3335V7.66659H14.6668V1.33325Z" />
    <path d="M8.3335 8.33325H14.6668V14.6666H8.3335V8.33325Z" />
    <path d="M7.66683 8.33325H1.3335V14.6666H7.66683V8.33325Z" />
  </svg>
);

const ThemePicker = () => {
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
