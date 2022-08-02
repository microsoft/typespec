import { FunctionComponent, useState } from "react";
import { Footer, Navbar } from "../../components";
//import { Grid } from  'react-loader-spinner'; 
import "./playground.css";

export const Playground: FunctionComponent = () => {
  //const [load, setLoad] = useState(true);
  //<Grid height="100" width="100" color= 'var(--main-color)' ariaLabel='loading'/>
  return (
    <div className="playground">
      <div></div><Navbar/>
      <div className="play-iframe">
      <iframe title="Cadl Playground" src="https://cadlplayground.z22.web.core.windows.net/" height="100%"></iframe>
      </div>
      <div><Footer/></div>
    </div>
  );
};
export default Playground
