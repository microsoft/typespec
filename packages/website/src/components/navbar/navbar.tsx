import { FunctionComponent } from "react";
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import "./navbar.css";
import {Link} from "react-router-dom";

export const Navbar: FunctionComponent = () => {
  return (
    <div className="navbar">
        <div className="navbar-logo">
          <a href="/"><h1>Cadl</h1></a>
        </div>
        <div className="navbar-links">
          <ul>
            <li> <Link to="/download">Download</Link></li>
            <li> <Link to="/docs">Docs</Link></li>
            <li> <Link to="/blog">Blog</Link></li>
            <li> <Link to="/play">Playground</Link></li>
            <li> <Link to="/community">Community</Link></li>
          </ul>
        </div>
      <div className="navbar-search_box">
      <SearchBox placeholder="Search" underlined={true} />
      </div>
    </div>
  );  
};
export default Navbar
