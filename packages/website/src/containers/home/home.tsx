import { FunctionComponent } from "react";
import {Brand, Cta, Navbar, Features, Possibility, Footer} from "../../components";
import "./home.css";

export const Home: FunctionComponent = () => {
  return (
    <div className="App">
      <div className="app_intro">
        <Navbar/>
        <div className="app_version">This is the current version 3.3!</div>
      </div>
      <Brand/>
      <Features/>
      <Possibility/>
      <Cta/>
      <Footer/>
    </div>
  );  
    
};
export default Home
