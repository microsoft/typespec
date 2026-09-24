// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Resolves a model provider that can safely represent a previously shipped base type.
    /// </summary>
    internal sealed class BackCompatModelBaseResolver
    {
        private readonly ModelProvider _model;
        private readonly ModelBaseTypeCompatibility _compatibility;

        public BackCompatModelBaseResolver(ModelProvider model)
        {
            _model = model;
            _compatibility = new ModelBaseTypeCompatibility(model);
        }

        public bool TryResolve(CSharpType previousBase, [NotNullWhen(true)] out ModelProvider? provider)
        {
            if (!TryResolveCandidate(previousBase, out provider) || !_compatibility.CanRestore(provider))
            {
                provider = null;
                return false;
            }

            return true;
        }

        private bool TryResolveCandidate(CSharpType previousBase, [NotNullWhen(true)] out ModelProvider? provider)
        {
            // A current input model can map to a differently named CLR type. Complete discovery
            // before selecting any candidate: a previously created mapping can be incompatible while
            // a later input supplies a compatible mapping for the same CLR identity.
            foreach (var inputModel in CodeModelGenerator.Instance.InputLibrary.InputNamespace.Models)
            {
                CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
            }

            if (TrySelectCreatedModelBase(previousBase, out provider, out var foundAmbiguousMapping))
            {
                return true;
            }
            if (foundAmbiguousMapping)
            {
                return false;
            }

            var mappedType = CodeModelGenerator.Instance.TypeFactory.CreateLastContractModelBase(previousBase, _model.InputModel);
            var lastContractBase = _model.LastContractView?.BaseTypeProvider;
            var currentBase = _model.InputModel.BaseModel;
            if (mappedType is null ||
                lastContractBase is null ||
                currentBase is null ||
                !mappedType.AreNamesEqual(previousBase))
            {
                provider = null;
                return false;
            }

            provider = new SystemObjectModelProvider(mappedType, currentBase, lastContractBase);
            return _compatibility.IsSupportedModelBase(provider);
        }

        private bool TrySelectCreatedModelBase(
            CSharpType previousBase,
            [NotNullWhen(true)] out ModelProvider? provider,
            out bool foundAmbiguousMapping)
        {
            // Candidate validation can build model-typed properties and create additional providers.
            // Snapshot the provider collections before evaluating any candidate to avoid mutating
            // their backing dictionaries while they are being enumerated.
            var createdCandidates = CodeModelGenerator.Instance.TypeFactory.CreatedModelProviders.ToArray();
            var mappedCandidates = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.Values.OfType<ModelProvider>().ToArray();
            var candidates = createdCandidates
                .Concat(mappedCandidates)
                .Where(candidate => candidate is SystemObjectModelProvider
                    ? candidate.Type.AreNamesEqual(previousBase)
                    : candidate.CachedType?.AreNamesEqual(previousBase) == true)
                .Where(_compatibility.IsSupportedModelBase)
                .Distinct()
                .ToArray();
            if (candidates.Length == 1)
            {
                provider = candidates[0];
                foundAmbiguousMapping = false;
                return true;
            }

            if (candidates.Length > 1)
            {
                if (candidates.Any(candidate => candidate is not SystemObjectModelProvider))
                {
                    provider = null;
                    foundAmbiguousMapping = true;
                    return false;
                }

                var compatibleMappedCandidates = candidates
                    .OfType<SystemObjectModelProvider>()
                    .Where(_compatibility.CanUseMappedBase)
                    .ToArray();
                if (compatibleMappedCandidates.Length == 1 ||
                    (compatibleMappedCandidates.Length > 1 &&
                        compatibleMappedCandidates.Skip(1).All(candidate =>
                            ModelBaseTypeCompatibility.AreMappedContractsEquivalent(compatibleMappedCandidates[0], candidate))))
                {
                    provider = compatibleMappedCandidates[0];
                    foundAmbiguousMapping = false;
                    return true;
                }

                provider = null;
                foundAmbiguousMapping = true;
                return false;
            }

            provider = null;
            foundAmbiguousMapping = false;
            return false;
        }
    }
}
