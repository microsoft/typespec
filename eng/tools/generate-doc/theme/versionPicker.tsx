import { DefaultThemeRenderContext, JSX } from "typedoc";

// Simple widget for selecting a version
export function versionPicker() {
  return (
    <div id="versionPickerDiv">
      <p class="caption"><span>Package version: </span>
        <select id="versionPicker"></select>
      </p>
    </div>
  );
};

export function versionPickerScript(context: DefaultThemeRenderContext) {
  return (
    <script async src={context.relativeURL("assets/versionPicker.js")}></script>
  )
}
