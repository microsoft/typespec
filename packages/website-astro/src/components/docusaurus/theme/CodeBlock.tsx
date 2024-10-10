/* eslint-disable unicorn/filename-case */
import { Code } from "@astrojs/starlight/components";

export default function CodeBlock({ children, className, language, title }) {
  return <Code code={children as any} lang={language} class={className} title={title} />;
}
