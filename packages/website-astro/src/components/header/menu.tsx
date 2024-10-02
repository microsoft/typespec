import { Menu, MenuItemLink, MenuList, MenuPopover, MenuTrigger } from "@fluentui/react-components";
import type { ReactNode } from "react";
import useBaseUrl from "../docusaurus/core/useBaseUrl";

export interface HeaderMenuProps {
  className?: string;
  children: ReactNode;
  links: { label: string; to: string }[];
}

export const HeaderMenu = ({ children, className, links }: HeaderMenuProps) => {
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <a className={className}>{children}</a>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          {links.map((link) => (
            // eslint-disable-next-line react-hooks/rules-of-hooks
            <MenuItemLink key={link.to} href={useBaseUrl(link.to)}>
              {link.label}
            </MenuItemLink>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
