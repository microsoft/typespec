// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal static partial class ProviderReferenceMapAnalyzer
    {
        private static HashSet<string> GetCustomInternalBoundaryNodes(
            ProviderReferenceGraph publicGraph,
            HashSet<string> customInternalDeclarations)
        {
            var boundaryNodes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in publicGraph.Nodes)
            {
                if (!publicGraph.References.TryGetValue(node, out var references))
                {
                    continue;
                }

                if (references.Overlaps(customInternalDeclarations))
                {
                    boundaryNodes.Add(node);
                }
            }

            return boundaryNodes;
        }

        private static HashSet<string> GetPublicDeclaredNodes(
            IReadOnlyList<TypeProvider> generatedProviders,
            HashSet<string> nodes)
        {
            return GetGeneratedDeclaredNodes(generatedProviders, nodes, publicOnly: false);
        }

        private static HashSet<string> GetPublicApiTraversalNodes(
            HashSet<string> internalizeDeclaredNodes,
            HashSet<string> publicDeclaredNodes,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            var traversalNodes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in internalizeDeclaredNodes)
            {
                if (generatedInternalDeclarations.Contains(node) ||
                    generatedImplementationInternalDeclarations.Contains(node))
                {
                    continue;
                }

                traversalNodes.Add(node);
            }

            foreach (var node in publicDeclaredNodes)
            {
                if (!generatedInternalDeclarations.Contains(node) &&
                    !generatedImplementationInternalDeclarations.Contains(node))
                {
                    traversalNodes.Add(node);
                }
            }

            return traversalNodes;
        }

        private static HashSet<string> GetInternalizeCandidates(
            HashSet<string> internalizeDeclaredNodes,
            HashSet<string> publicReachable,
            HashSet<string> customInternalDeclarations,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> customInternalBoundaryNodes,
            HashSet<string> customPublicRoots,
            HashSet<string> publicRoots,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, HashSet<string>> references)
        {
            var candidates = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in internalizeDeclaredNodes)
            {
                var isNonRootKept = IsKeptName(node, CodeModelGenerator.Instance.NonRootTypes, nodes);
                var isPublicReachableNonRootKept = isNonRootKept && publicReachable.Contains(node);
                if (!publicReachable.Contains(node) ||
                    customInternalDeclarations.Contains(node) ||
                    generatedInternalDeclarations.Contains(node) && !customPublicRoots.Contains(node) && !isPublicReachableNonRootKept ||
                    customInternalBoundaryNodes.Contains(node) && (!publicRoots.Contains(node) || isNonRootKept) ||
                    isNonRootKept &&
                        references.TryGetValue(node, out var nodeReferences) &&
                        (nodeReferences.Overlaps(customInternalDeclarations) ||
                            nodeReferences.Overlaps(generatedInternalDeclarations)))
                {
                    candidates.Add(node);
                }
            }

            // If a public non-root type exposes something that must remain internal, make the
            // exposing type internal too. That avoids generating public APIs with internal types.
            var addedCandidate = true;
            while (addedCandidate)
            {
                addedCandidate = false;
                foreach (var node in internalizeDeclaredNodes)
                {
                    var isNonRootKept = IsKeptName(node, CodeModelGenerator.Instance.NonRootTypes, nodes);
                    if (candidates.Contains(node) ||
                        publicRoots.Contains(node) && !isNonRootKept ||
                        !references.TryGetValue(node, out var nodeReferences) ||
                        !nodeReferences.Overlaps(candidates))
                    {
                        continue;
                    }

                    candidates.Add(node);
                    addedCandidate = true;
                }
            }

            // Non-root keep entries preserve the declared type/file, but deliberately do not
            // root their dependencies. They can still be internalized when needed to avoid
            // exposing custom/internal types through a public surface.
            RemoveKeptNonRootNames(candidates, nodes, references, customInternalDeclarations, generatedInternalDeclarations, customInternalBoundaryNodes);
            return candidates;
        }

        private static void RemovePublicApiExposedCandidates(
            HashSet<string> internalizeDeclaredNodes,
            HashSet<string> candidates,
            HashSet<string> customInternalDeclarations,
            IReadOnlyDictionary<string, HashSet<string>> references)
        {
            var removedCandidate = true;
            while (removedCandidate)
            {
                removedCandidate = false;
                foreach (var candidate in candidates.ToArray())
                {
                    if (customInternalDeclarations.Contains(candidate))
                    {
                        continue;
                    }

                    foreach (var node in internalizeDeclaredNodes)
                    {
                        if (candidates.Contains(node) ||
                            !references.TryGetValue(node, out var nodeReferences) ||
                            !nodeReferences.Contains(candidate))
                        {
                            continue;
                        }

                        candidates.Remove(candidate);
                        removedCandidate = true;
                        break;
                    }
                }
            }
        }

        private static void AddNestedInternalizeCandidates(
            IReadOnlyList<TypeProvider> generatedProviders,
            HashSet<string> candidates,
            HashSet<string> nodes)
        {
            var addedCandidate = true;
            while (addedCandidate)
            {
                addedCandidate = false;
                foreach (var provider in generatedProviders)
                {
                    var declaringType = provider.DeclaringTypeProvider?.Type;
                    if (declaringType == null ||
                        !candidates.Contains(GetProviderTypeName(declaringType)))
                    {
                        continue;
                    }

                    var providerName = GetProviderTypeName(provider.Type);
                    if (nodes.Contains(providerName) && candidates.Add(providerName))
                    {
                        addedCandidate = true;
                    }
                }
            }
        }

        /// <summary>
        /// Internalizes dependencies whose generated predecessors are all internal, unless the dependency
        /// is an explicit public root. Repeats until transitive internal-only dependencies are included.
        /// </summary>
        private static void AddInternalOnlyDependencyCandidates(
            HashSet<string> internalizeDeclaredNodes,
            HashSet<string> candidates,
            HashSet<string> customInternalDeclarations,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> explicitPublicRoots,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            var addedCandidate = true;
            while (addedCandidate)
            {
                addedCandidate = false;
                foreach (var node in internalizeDeclaredNodes)
                {
                    if (candidates.Contains(node) || explicitPublicRoots.Contains(node))
                    {
                        continue;
                    }

                    var hasPredecessor = false;
                    var allPredecessorsInternalized = true;
                    foreach (var (owner, children) in references)
                    {
                        if (string.Equals(owner, node, StringComparison.Ordinal) ||
                            generatedImplementationInternalDeclarations.Contains(owner) ||
                            !children.Contains(node))
                        {
                            continue;
                        }

                        hasPredecessor = true;
                        if (!candidates.Contains(owner) &&
                            !customInternalDeclarations.Contains(owner) &&
                            !generatedInternalDeclarations.Contains(owner))
                        {
                            allPredecessorsInternalized = false;
                            break;
                        }
                    }

                    if (hasPredecessor && allPredecessorsInternalized && candidates.Add(node))
                    {
                        addedCandidate = true;
                    }
                }
            }
        }

        /// <summary>
        /// Finds generated declarations that must be promoted to public because they are exposed by a
        /// reachable public API, while respecting explicit internal boundaries and helper-only roots.
        /// </summary>
        private static HashSet<string> GetPublicCandidates(
            HashSet<string> publicDeclaredNodes,
            HashSet<string> publicReachable,
            HashSet<string> customInternalDeclarations,
            HashSet<string> customInternalBoundaryNodes,
            HashSet<string> internalizeHelperRoots,
            HashSet<string> publicRootExclusions,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> publicRoots,
            Dictionary<string, HashSet<string>> publicApiReferences,
            Dictionary<string, HashSet<string>> internalizeReferences,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            var candidates = new HashSet<string>(StringComparer.Ordinal);
            foreach (var node in publicDeclaredNodes)
            {
                if (customInternalDeclarations.Contains(node) ||
                    customInternalBoundaryNodes.Contains(node) ||
                    internalizeHelperRoots.Contains(node) ||
                    publicRootExclusions.Contains(node) ||
                    !publicReachable.Contains(node))
                {
                    continue;
                }

                if (generatedInternalDeclarations.Contains(node) &&
                    !publicRoots.Contains(node) &&
                    !HasPublicApiPredecessor(node, publicApiReferences, publicReachable, generatedImplementationInternalDeclarations))
                {
                    continue;
                }

                if (!publicRoots.Contains(node) &&
                    !HasPublicApiPredecessor(node, internalizeReferences, publicReachable, generatedInternalDeclarations, generatedImplementationInternalDeclarations))
                {
                    continue;
                }

                candidates.Add(node);
            }

            return candidates;
        }

        private static HashSet<string> GetRemovalCandidates(
            IReadOnlyList<TypeProvider> providers,
            IReadOnlyList<TypeProvider> generatedProviders,
            ProviderReferenceGraph graph,
            HashSet<string> customRemovalRoots,
            HashSet<string> generatedDiscriminatorBaseNames)
        {
            var removeRoots = GetRootNames(
                providers,
                graph.Nodes,
                helperRoots: [],
                includeModelFactory: true,
                includeAdditionalRoots: true,
                includeUnionVariantRoots: true,
                publicClientRootsOnly: false);

            removeRoots.UnionWith(customRemovalRoots);
            AddKeptNonRootNames(removeRoots, graph.Nodes);

            var removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            AddDerivedModelReferences(providers, graph.Nodes, graph.References, removeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            AddBasePreservedReferences(generatedProviders, graph.Nodes, graph.References, removeReachableWithoutHelpers);

            var removeHelperRoots = GetHelperRootNames(generatedProviders, graph.Nodes, removeReachableWithoutHelpers, graph.References, includeModelSerializationProviders: true);
            removeRoots.UnionWith(removeHelperRoots);

            var removeReachable = GetReachableTypes(removeRoots, graph.References);
            AddBasePreservedReferences(generatedProviders, graph.Nodes, graph.References, removeReachable);

            var removeDeclaredNodes = GetGeneratedDeclaredNodes(generatedProviders, graph.Nodes, publicOnly: false);
            removeDeclaredNodes.ExceptWith(removeReachable);
            return removeDeclaredNodes;
        }

        private static void AddKeptNonRootNames(HashSet<string> roots, HashSet<string> nodes)
        {
            var nonRootTypes = CodeModelGenerator.Instance.NonRootTypes;
            foreach (var node in nodes)
            {
                if (IsKeptName(node, nonRootTypes, nodes))
                {
                    roots.Add(node);
                }
            }
        }

        private static void RemoveKeptNonRootNames(
            HashSet<string> candidates,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string> customInternalDeclarations,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> customInternalBoundaryNodes)
        {
            var nonRootTypes = CodeModelGenerator.Instance.NonRootTypes;
            foreach (var node in nodes)
            {
                if (customInternalDeclarations.Contains(node) ||
                    generatedInternalDeclarations.Contains(node) ||
                    customInternalBoundaryNodes.Contains(node))
                {
                    continue;
                }

                if (IsKeptName(node, nonRootTypes, nodes) &&
                    !HasCandidateReference(node, candidates, references))
                {
                    candidates.Remove(node);
                }
            }
        }

        private static bool HasCandidateReference(
            string node,
            HashSet<string> candidates,
            IReadOnlyDictionary<string, HashSet<string>> references)
        {
            if (references.TryGetValue(node, out var nodeReferences))
            {
                foreach (var reference in nodeReferences)
                {
                    if (!string.Equals(reference, node, StringComparison.Ordinal) &&
                        candidates.Contains(reference))
                    {
                        return true;
                    }
                }
            }

            foreach (var (source, sourceReferences) in references)
            {
                if (!string.Equals(source, node, StringComparison.Ordinal) &&
                    candidates.Contains(source) &&
                    sourceReferences.Contains(node))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
