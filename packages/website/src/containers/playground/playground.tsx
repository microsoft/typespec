import { FunctionComponent} from "react";
import { Footer, Navbar } from "../../components";
import "./playground.css";

export const Playground: FunctionComponent = () => {
  return (
    <div className="playground">
      <Navbar/>
      <div className="play-iframe">
      <iframe title="Cadl Playground" src="https://cadlplayground.z22.web.core.windows.net/"/>
      </div>
      <Footer/>
    </div>
  );
};
export default Playground
