import type { WrapperProps } from "@docusaurus/types";
import Navbar from "@theme-original/Navbar";
import type NavbarType from "@theme/Navbar";

type Props = WrapperProps<typeof NavbarType>;

export default function NavbarWrapper(props: Props) {
  return (
    <>
      <div id="cookie-banner"></div>
      <Navbar {...props} />
    </>
  );
}
