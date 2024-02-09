import { ClientModule } from "@docusaurus/types";
import { AppInsightsCore } from "@microsoft/1ds-core-js";
import { PostChannel } from "@microsoft/1ds-post-js";

const appInsightsCore = new AppInsightsCore();

//Initialize SDK
appInsightsCore.initialize(
  {
    // TODO: change with this when we have done privacy review
    // instrumentationKey: "typespec_io",
    instrumentationKey: "81dcd948-a4f2-48f3-985c-ed3942c3433c",
  },
  [new PostChannel()]
);

const clientModule: ClientModule = {
  onRouteDidUpdate({ location, previousLocation }) {
    if (
      previousLocation &&
      (location.pathname !== previousLocation.pathname ||
        location.search !== previousLocation.search ||
        location.hash !== previousLocation.hash)
    ) {
      // don't log hash, leave for client side data
      appInsightsCore?.track({
        baseType: "PageViewData",
        name: location.pathname + location.search,
      });
    }
  },
};

export default clientModule;
