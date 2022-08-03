import { FunctionComponent } from "react";
import { Footer, Navbar } from "../../components";
import "./download.css";

export const Download: FunctionComponent = () => {
  return (
    <div className="download">
      <Navbar/>
      <p>Download</p>
      <Footer/>
    </div>
  );
};
export default Download
