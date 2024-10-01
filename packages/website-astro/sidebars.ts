import type { StarlightPlugin } from "@astrojs/starlight/types";
import current from "./src/content/current-sidebar";

export type StarlightUserConfig = Parameters<StarlightPlugin["hooks"]["setup"]>["0"]["config"];
export type StarlightSidebarUserConfig = StarlightUserConfig["sidebar"];
export type SidebarItem = StarlightSidebarUserConfig;

export async function resolveSideBars(): Promise<NonNullable<StarlightSidebarUserConfig>> {
  return processSidebar("current", current);
}

async function processSidebar(
  directory: string,
  items: NonNullable<StarlightSidebarUserConfig>,
): Promise<NonNullable<StarlightSidebarUserConfig>> {
  function prefix(name: string) {
    return `${directory}/${name}`;
  }

  const result: NonNullable<StarlightSidebarUserConfig> = [];
  for (const item of items) {
    if (typeof item === "string") {
      result.push(prefix(item));
    } else if ("items" in item) {
      result.push({
        ...item,
        collapsed: item.collapsed ?? true,
        items: await processSidebar(directory, item.items),
      });
    } else if ("autogenerate" in item) {
      result.push({
        ...item,
        collapsed: item.collapsed ?? true,
        autogenerate: {
          ...item.autogenerate,
          directory: prefix(item.autogenerate.directory),
        },
      });
    } else if ("slug" in item) {
      result.push({ ...item, slug: prefix(item.slug) });
    } else {
      result.push(item);
    }
  }
  console.log("Result", result);
  return result;
}
