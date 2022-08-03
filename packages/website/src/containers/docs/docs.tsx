import { FunctionComponent } from "react";
import { Footer, Navbar } from "../../components";
import "./docs.css";

export const Docs: FunctionComponent = () => {
  return (
    <div className="docs">
      <Navbar/>
      <p>Docs</p>
      <Footer/>
    </div>
  );
};
export default Docs
