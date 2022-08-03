import { FunctionComponent } from "react";
import { Footer, Navbar } from "../../components";
import "./blog.css";

export const Blog: FunctionComponent = () => {
  return (
    <div className="blog">
      <Navbar/>
      <p>Blog</p>
      <Footer/>
    </div>
  );
    
};
export default Blog
