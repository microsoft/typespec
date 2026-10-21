// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
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
            if (!TryResolveCandidate(previousBase, out provider) ||
                !_compatibility.CanRestore(provider) ||
                !_model.CanRestoreLastContractModelBase(provider))
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

            if (TrySelectCreatedModelBase(previousBase, out provider, out var foundAmbiguousMapping) &&
                (_model.InputModel.BaseModel is not null || provider is not SystemObjectModelProvider))
            {
                return true;
            }
            // Flat mapped restoration must go through the downstream opt-in even when a provider
            // already exists. Rebuild a model-local projection rather than bypassing its veto.
            if (foundAmbiguousMapping)
            {
                return false;
            }

            var mappedType = CodeModelGenerator.Instance.TypeFactory.CreateLastContractModelBase(previousBase, _model.InputModel);
            var lastContractBase = _model.LastContractView?.BaseTypeProvider;
            var currentBase = _model.InputModel.BaseModel;
            if (mappedType is null ||
                lastContractBase is null ||
                !mappedType.AreNamesEqual(previousBase))
            {
                provider = null;
                return false;
            }

            if (currentBase is not null)
            {
                provider = new SystemObjectModelProvider(mappedType, currentBase, lastContractBase);
            }
            else
            {
                // Read the shipped surface without projecting any current properties first. Only
                // compatible inherited properties belong to the mapped base, not the entire flat model.
                var historicalBase = new SystemObjectModelProvider(mappedType, _model.InputModel, lastContractBase, []);
                if (!_compatibility.IsSupportedModelBase(historicalBase))
                {
                    provider = null;
                    return false;
                }
                var historicalProperties = historicalBase.Properties;
                var mappedProperties = new List<InputModelProperty>();
                foreach (var property in _model.InputModel.Properties)
                {
                    var matches = historicalProperties.Where(previous =>
                        CodeModelGenerator.Instance.TypeFactory.IsLastContractModelBasePropertyCompatible(mappedType, property, previous)).ToArray();
                    if (matches.Length > 1 || historicalProperties.Any(previous =>
                        MappedModelBaseCompatibility.HasKnownPropertyIdentity(property, previous) &&
                        (matches.Length == 0 || !ReferenceEquals(matches[0], previous))))
                    {
                        provider = null;
                        return false;
                    }
                    if (matches.Length == 1)
                    {
                        // Honor the real source owner's veto, including cached removals, without
                        // populating the cache during a potentially reentrant property conversion.
                        if (CodeModelGenerator.Instance.TypeFactory.IsPropertyRemoved(property, _model))
                        {
                            provider = null;
                            return false;
                        }
                        mappedProperties.Add(property);
                    }
                }
                provider = new SystemObjectModelProvider(mappedType, _model.InputModel, lastContractBase, mappedProperties);
            }
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

                // Flat candidates establish discovery equivalence only. The model-local projection
                // is rebuilt through the downstream opt-in and validated afterward.
                var compatibleMappedCandidates = candidates
                    .OfType<SystemObjectModelProvider>()
                    .Where(candidate => _model.InputModel.BaseModel is null || _compatibility.CanUseMappedBase(candidate))
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
