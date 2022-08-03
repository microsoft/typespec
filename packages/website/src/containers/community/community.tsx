import { FunctionComponent } from "react";
import { Footer, Navbar } from "../../components";
import "./community.css";

export const Community: FunctionComponent = () => {
  return (
    <div className="community">
      <Navbar/>
      <p>Community</p>
      <Footer/>
    </div>
  );
};
export default Community
