import { JSX,
  PageEvent,
  Reflection,
  DefaultThemeRenderContext,
  } from "typedoc";

// Our toolbar is identical to the default one, but we add a link to go back to the main index
export const toolbar = (context: DefaultThemeRenderContext, props: PageEvent<Reflection>) => (
  <header class="tsd-page-toolbar">
      <div class="tsd-toolbar-contents container">
          <div class="table-cell" id="tsd-search" data-base={context.relativeURL("./")}>
              <div class="field">
                  <label for="tsd-search-field" class="tsd-widget search no-caption">
                      {context.icons.search()}
                  </label>
                  <input type="text" id="tsd-search-field" aria-label="Search" />
              </div>

              <ul class="results">
                  <li class="state loading">Preparing search index...</li>
                  <li class="state failure">The search index is not available</li>
              </ul>

              <a href="https://azure.github.io/azure-sdk-for-js" class="title">Back To Index</a> |&nbsp;
              <a href={context.relativeURL("index.html")} class="title">
                  {props.project.name}
              </a>
          </div>

          <div class="table-cell" id="tsd-widgets">
              <a href="#" class="tsd-widget menu no-caption" data-toggle="menu" aria-label="Menu">
                  {context.icons.menu()}
              </a>
          </div>
      </div>
  </header>
);
