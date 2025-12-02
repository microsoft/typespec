# Dashboard Overview Mode

The dashboard now supports two view modes:

## Legacy Mode (Default)

The original view that displays all emitters in expandable tables showing detailed scenario coverage.

```tsx
import { Dashboard } from "@typespec/spec-dashboard";

<Dashboard coverageSummaries={summaries} />;
```

## Overview Mode (New)

A high-level view with two pages:

1. **Overview Page**: Shows coverage percentages per emitter in a card-based layout
2. **Detail Page**: Shows all scenarios for a specific emitter when clicked

To enable overview mode, set `useOverviewMode={true}`:

```tsx
import { Dashboard } from "@typespec/spec-dashboard";

<Dashboard coverageSummaries={summaries} useOverviewMode={true} />;
```

### Features

- **Interactive Cards**: Each emitter is displayed in a card showing:
  - Emitter name
  - Coverage percentage with color coding
  - Scenario counts (covered/total)
  - Generator version
  - Language icons (TypeScript, Python, C#, Java, Go, Rust, C++)
- **Tier Filtering**: Filter scenarios by tier (defaults to "core")
  - Sticky selection: Selected tier persists when navigating between overview and detail pages
  - URL-based state: Tier selection is stored in the URL for easy sharing
- **Click Navigation**: Click any emitter card to view detailed scenario coverage
- **Back Navigation**: Return to overview from detail pages

### Standalone Components

You can also use the components independently:

```tsx
import { EmitterOverview, EmitterDetail } from "@typespec/spec-dashboard";
import { BrowserRouter, Route, Routes } from "react-router-dom";

<BrowserRouter>
  <Routes>
    <Route
      path="/"
      element={<EmitterOverview coverageSummaries={summaries} scenarioTierConfig={tierConfig} />}
    />
    <Route
      path="/emitter/:emitterName"
      element={<EmitterDetail coverageSummaries={summaries} scenarioTierConfig={tierConfig} />}
    />
  </Routes>
</BrowserRouter>;
```

**Note**: Both `EmitterOverview` and `EmitterDetail` support optional `scenarioTierConfig` prop for tier filtering.

## Migration Guide

The new mode is opt-in to maintain backward compatibility. To migrate:

1. Add `react-router-dom` dependency (already included if using Dashboard)
2. Set `useOverviewMode={true}` on your Dashboard component
3. Test the new interface with your users
4. (Optional) Switch permanently by removing the legacy mode in a future version
