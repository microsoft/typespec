import { FunctionComponent } from "react";
import {Home, Blog, Community, Docs, Download, Playground, PageNotFound} from "./containers";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import "./app.css"; 

export const App: FunctionComponent = () => {
  return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/download" element={<Download/>}/>
      <Route path="/docs" element={<Docs/>}/>
      <Route path="/blog" element={<Blog/>}/>
      <Route path="/play" element={<Playground/>}/>
      <Route path="/community" element={<Community/>}/>
      <Route path="*" element={<PageNotFound/>}/>
      </Routes>
  </BrowserRouter>
  );  
};
export default App
