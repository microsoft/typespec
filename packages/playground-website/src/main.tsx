import { FunctionComponent, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserHost , registerMonacoLanguage, getStateFromUrl, saveTypeSpecContentInQueryParameter, registerMonacoDefaultWorkers} from "@typespec/playground";
import { StyledPlayground } from "@typespec/playground/react";

import "./style.css";

const host = await createBrowserHost();
await registerMonacoLanguage(host);
registerMonacoDefaultWorkers()

const initialState = getStateFromUrl();
const App: FunctionComponent = () => {
  const save = useCallback((content: string) => {
    void saveTypeSpecContentInQueryParameter(content);
  }, []);
  return <StyledPlayground host={host} defaultState={initialState} onSave={save} />;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
