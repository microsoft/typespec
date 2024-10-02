import { Menu, MenuItemLink, MenuList, MenuPopover, MenuTrigger } from "@fluentui/react-components";
import type { ReactNode } from "react";

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
            <MenuItemLink key={link.to} href={link.to}>
              {link.label}
            </MenuItemLink>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
