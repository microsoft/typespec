---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/versioning"
---

Remove deprecated versioning projection, switch to the mutator approach

  ```diff lang="tsp"
  // Step 1: Update to retrieve the mutation instead of projections
  -const versions = buildVersionProjections(program, service.type);
  +const versions = getVersioningMutators(program, service.type);
  
  // Step 2: call mutator instead of projection api
  -const projectedProgram = projectProgram(originalProgram, versionRecord.projections);
  +const subgraph = unsafe_mutateSubgraphWithNamespace(program, [mutator], service.type);
  +subgraph.type // this is the mutated service namespace
  ```
