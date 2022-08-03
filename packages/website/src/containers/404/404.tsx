import { FunctionComponent } from "react";
import { Footer, Navbar } from "../../components";
import "./404.css";

export const PageNotFound: FunctionComponent = () => {
  return (
    <div className="PageNotFound">
      <Navbar/>
      <h1>404 <br/></h1>
      <h4>404 Page Not Found!</h4>
      <Footer/>
    </div>
  );
};
export default PageNotFound
