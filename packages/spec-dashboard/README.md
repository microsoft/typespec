# Spector Dashboard

## Coverage overview groups

Use `groupEmitters` to combine emitters into named overview cards:

```tsx
<Dashboard
  coverageSummaries={coverageSummaries}
  showOverview
  groupEmitters={[
    {
      name: "C#",
      emitters: ["@azure-typespec/http-client-csharp", "@azure-typespec/http-client-csharp-mgmt"],
    },
  ]}
  emitterDisplayNames={{
    "@azure-typespec/http-client-csharp": "C# (Data plane)",
    "@azure-typespec/http-client-csharp-mgmt": "C# (Management plane)",
  }}
/>
```

Each card shows the union of its emitters' coverage, with individual percentages underneath.
A scenario counts once per table and is covered if any member reports `pass`, `not-applicable`,
or `not-supported`. Two emitters each covering 50 of 100 scenarios, with 25 shared successes,
produce **75%** combined coverage. Counts follow the selected tier and use each table's reports;
equally named scenarios in different tables/spec sets remain separate.

Groups and emitter rows follow the configured order; ungrouped emitters keep separate cards
afterward. `emitterDisplayNames` controls row and table labels without affecting grouping.
These options are also available on `DashboardFromAzureStorage`'s `options` and do not change
table columns or report loading.

## Dev

```bash
npm run start
# or
npm run dev
```

## Show the test generator

Add `?showtest=true` query parameter to url http://localhost:5173/?showtest=true
