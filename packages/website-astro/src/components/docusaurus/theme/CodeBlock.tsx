/* eslint-disable unicorn/filename-case */

export default function CodeBlock({ children, className, language, title }) {
  // return <Code code={children as any} lang={language} class={className} title={title} />;
  return <code>{children}</code>;
}
