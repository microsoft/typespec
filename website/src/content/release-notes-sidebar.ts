import type { SidebarItem } from "@typespec/astro-utils/sidebar";

const sidebar: SidebarItem[] = [
  {
    label: "🚀 Release Notes",
    expanded: true,
    autogenerate: {
      order: "desc",
      directory: ".",
    },
  },
];

export default sidebar;
