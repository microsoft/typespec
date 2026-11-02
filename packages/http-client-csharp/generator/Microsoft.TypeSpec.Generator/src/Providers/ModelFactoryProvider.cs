// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class ModelFactoryProvider : TypeProvider
    {
        private const string ModelFactorySuffix = "ModelFactory";
        private const string AdditionalBinaryDataParameterName = "additionalBinaryDataProperties";
        private const string JsonPatchParameterName = "patch";

        private readonly IEnumerable<InputModelType> _models;

        protected internal ModelFactoryProvider(IEnumerable<InputModelType> models)
        {
            _models = models;
        }

        internal bool PreserveLeadingMethodSeparator { get; set; }

        protected override string BuildName() => string.Concat(CodeModelGenerator.Instance.TypeFactory.ServiceName, ModelFactorySuffix);

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override string BuildNamespace() => CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(CodeModelGenerator.Instance.InputLibrary.InputNamespace.Name);

        protected override XmlDocProvider BuildXmlDocs()
        {
            var docs = new XmlDocProvider(new XmlDocSummaryStatement(
                [$"A factory class for creating instances of the models for mocking."]));

            return docs;
        }

        protected internal override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>(_models.Count());
            foreach (var model in _models)
            {
                var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model);

                if (modelProvider is null)
                {
                    continue;
                }

                var typeToInstantiate = GetModelToInstantiateForFactoryMethod(modelProvider);
                if (typeToInstantiate is null)
                {
                    continue;
                }

                var (_, fullConstructor) = GetBinaryDataParamAndFullCtorForFactoryMethod(modelProvider);
                var signature = new MethodSignature(
                    modelProvider.Name,
                    null,
                    MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                    modelProvider.Type,
                    $"A new {modelProvider.Type:C} instance for mocking.",
                    GetParameters(modelProvider, fullConstructor),
                    Attributes: ExperimentalApiHelpers.BuildAttributes(model.Experimental));

                var parameters = new List<XmlDocParamStatement>(signature.Parameters.Count);
                foreach (var param in signature.Parameters)
                {
                    parameters.Add(new XmlDocParamStatement(param));
                }

                var docs = new XmlDocProvider(
                    modelProvider.XmlDocs.Summary,
                    parameters,
                    returns: new XmlDocReturnsStatement($"A new {modelProvider.Type:C} instance for mocking."));

                MethodBodyStatement statements = ConstructMethodBody(signature, typeToInstantiate);

                methods.Add(new MethodProvider(signature, statements, this, docs,
                    suppressions: ExperimentalApiHelpers.MergeSuppressions(
                        ExperimentalApiHelpers.GetReferenceSuppressions(model),
                        ExperimentalApiHelpers.GetReferenceSuppressions(model.AdditionalProperties),
                        model.Properties.SelectMany(property => ExperimentalApiHelpers.GetReferenceSuppressions(property.Type)))));
            }

            return [.. methods];
        }

        protected internal sealed override IReadOnlyList<MethodProvider> BuildMethodsForBackCompatibility(IEnumerable<MethodProvider> originalMethods)
        {
            if (LastContractView?.Methods == null || LastContractView.Methods.Count == 0)
            {
                return [.. originalMethods];
            }

            IReadOnlyList<MethodProvider> customFactoryMethods = CustomCodeView?.Methods ?? [];
            List<MethodProvider> factoryMethods = [.. originalMethods];

            // Preserve the original parameter names on current factory methods when the only
            // change between the previous and current contract is a parameter rename. This
            // avoids source-breaking changes for callers using named arguments (e.g. when a
            // property is renamed via @@clientName, spec rename, or naming-rule change).
            BackCompatHelper.RestorePreviousParameterNames(this, factoryMethods);

            var allFactoryMethods = factoryMethods
               .Concat(customFactoryMethods)
               .ToList();

            var previousPublicSignatures = LastContractView.Methods
                .Where(method => MethodSignatureHelper.IsPublicApi(method.Signature))
                .Select(method => method.Signature)
                .ToList();
            RestorePublishedParameterDefaults(factoryMethods, customFactoryMethods, previousPublicSignatures);

            // Classify published methods after restoring their defaults.
            var compatiblePreviousMethods = new List<MethodProvider>();
            List<MethodSignature> preservedPreviousSignatures = [];

            foreach (var previousMethod in LastContractView.Methods)
            {
                if (!MethodSignatureHelper.IsPublicApi(previousMethod.Signature))
                {
                    continue;
                }

                var matchingCurrentMethod = allFactoryMethods.FirstOrDefault(m =>
                    MethodSignature.MethodSignatureComparer.Equals(m.Signature, previousMethod.Signature));
                if (matchingCurrentMethod is not null)
                {
                    bool isGeneratedMethod = factoryMethods.Any(method => ReferenceEquals(method, matchingCurrentMethod));
                    // Required hidden shims preserve binary signatures, not omitted-argument calls.
                    if (isGeneratedMethod && IsRequiredHiddenCompatibilityMethod(matchingCurrentMethod.Signature))
                    {
                        continue;
                    }

                    if (GetMinimumArgumentCount(matchingCurrentMethod.Signature) == GetMinimumArgumentCount(previousMethod.Signature))
                    {
                        preservedPreviousSignatures.Add(previousMethod.Signature);
                    }

                    continue;
                }

                // If the removal of this factory method has already been accepted in the ApiCompat
                // baseline, honor that decision and do not resurrect a compatibility shim for it.
                if (BackCompatHelper.IsMethodRemovalAcceptedInBaseline(this, previousMethod.Signature))
                {
                    continue;
                }

                var unavailableTypes = GetUnavailableSignatureTypes(previousMethod.Signature);
                if (unavailableTypes.Count > 0)
                {
                    CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                        DiagnosticCodes.UnavailableBackcompatType,
                        $"Skipped backward compatible model factory method '{previousMethod.Signature.FullMethodName}' because its signature references unavailable type(s): {string.Join(", ", unavailableTypes)}.");
                    continue;
                }

                compatiblePreviousMethods.Add(previousMethod);
                preservedPreviousSignatures.Add(previousMethod.Signature);
            }

            // Required custom methods do not need omitted arguments to be disambiguated. A custom
            // method that increased its published minimum must also leave those calls to the factory.
            var constrainingCustomSignatures = customFactoryMethods
                .Select(method => method.Signature)
                .Where(HasOptionalParameters)
                .Where(current => !previousPublicSignatures.Any(previous =>
                    MethodSignature.MethodSignatureComparer.Equals(previous, current)
                    && GetMinimumArgumentCount(current) > GetMinimumArgumentCount(previous)))
                .ToList();

            // Constrain only new factories. Published custom signatures remain in the preserved
            // set for visible reorder replacements, but use the current custom defaults here.
            foreach (var currentMethod in factoryMethods)
            {
                if (previousPublicSignatures.Any(previous =>
                    MethodSignature.MethodSignatureComparer.Equals(previous, currentMethod.Signature)))
                {
                    continue;
                }

                // Exclude signatures served by this factory or restored below as compatibility
                // methods: hidden shims require all arguments; reorder replacements take its place.
                var competingSignatures = preservedPreviousSignatures
                    .Where(signature => !compatiblePreviousMethods.Any(method =>
                        ReferenceEquals(method.Signature, signature)))
                    .Where(signature => !MethodSignatureHelper.HaveSameParametersInSameOrder(
                        currentMethod.Signature,
                        signature))
                    .Where(signature => !customFactoryMethods.Any(method =>
                        MethodSignature.MethodSignatureComparer.Equals(signature, method.Signature)))
                    .Concat(constrainingCustomSignatures)
                    .Where(signature =>
                        signature.Name == currentMethod.Signature.Name
                        && !MethodSignature.MethodSignatureComparer.Equals(signature, currentMethod.Signature))
                    .ToList();
                MethodSignatureHelper.RequireMinimumParameterPrefix(
                    currentMethod.Signature,
                    competingSignatures,
                    preservePublishedMinimumArgumentCount: false);
            }

            foreach (var previousMethod in compatiblePreviousMethods)
            {
                List<MethodSignature> currentOverloads = [];
                bool foundCompatibleOverload = false;
                var currentOverloadSignatures = GetCurrentOverloadSignatures(
                    allFactoryMethods,
                    previousMethod.Signature.Name);

                // Attempt to find an updated method in the current contract to call
                foreach (var currentMethodSignature in currentOverloadSignatures)
                {
                    if (MethodSignatureHelper.HaveSameParametersInSameOrder(currentMethodSignature, previousMethod.Signature))
                    {
                        foundCompatibleOverload = true;
                        break;
                    }

                    if (HasMatchingExactParameterNames(currentMethodSignature, previousMethod.Signature))
                    {
                        CodeModelGenerator.Instance.Emitter.Info(
                            $"Model factory method '{Name}.{previousMethod.Signature.Name}' keeps its exact parameter name(s) instead of the last contract's.",
                            BackCompatibilityChangeCategory.ModelFactoryMethodSkipped);
                        foundCompatibleOverload = true;
                        break;
                    }

                    currentOverloads.Add(currentMethodSignature);
                }

                if (foundCompatibleOverload)
                {
                    continue;
                }

                // Generated overloads were constrained above, so only immutable custom overloads can
                // still force a compatibility signature to change its published optionality. A custom
                // overload that reproduces a preserved published signature is excluded as well: it
                // already coexisted with this signature in the published contract, so the calls that
                // reach both of them were valid before and must keep compiling.
                var compatibilityOverloadSignatures = customFactoryMethods
                    .Select(method => method.Signature)
                    .Where(signature =>
                        signature.Name == previousMethod.Signature.Name
                        && !preservedPreviousSignatures.Any(previous =>
                            MethodSignature.MethodSignatureComparer.Equals(previous, signature)))
                    .ToList();

                foreach (var currentOverload in currentOverloads)
                {
                    // If the parameter ordering is the only difference, just use the previous method.
                    if (MethodSignatureHelper.ContainsSameParameters(previousMethod.Signature, currentOverload)
                        && !previousPublicSignatures.Any(previous =>
                            MethodSignature.MethodSignatureComparer.Equals(previous, currentOverload)))
                    {
                        var factoryMethodToRemove = factoryMethods
                            .FirstOrDefault(m => MethodSignature.MethodSignatureComparer.Equals(m.Signature, currentOverload));
                        if (TryBuildCompatibleMethodForPreviousContract(
                            previousMethod,
                            currentOverload,
                            false,
                            compatibilityOverloadSignatures,
                            out MethodProvider? replacedMethod))
                        {
                            factoryMethods.Add(replacedMethod);

                            if (factoryMethodToRemove != null)
                            {
                                factoryMethods.Remove(factoryMethodToRemove);
                            }

                            CodeModelGenerator.Instance.Emitter.Debug(
                                $"Replaced model factory method '{Name}.{currentOverload.Name}' with previous parameter order from last contract.",
                                BackCompatibilityChangeCategory.ModelFactoryMethodReplaced);
                            foundCompatibleOverload = true;
                            break;
                        }
                    }

                    if (TryBuildCompatibleMethodForPreviousContract(
                        previousMethod,
                        currentOverload,
                        true,
                        compatibilityOverloadSignatures,
                        out var hiddenMethod))
                    {
                        factoryMethods.Add(hiddenMethod);
                        CodeModelGenerator.Instance.Emitter.Debug(
                            $"Added back-compat overload for model factory method '{Name}.{previousMethod.Signature.Name}' delegating to '{currentOverload.Name}'.",
                            BackCompatibilityChangeCategory.ModelFactoryMethodAdded);
                        foundCompatibleOverload = true;
                        break;
                    }
                }

                if (foundCompatibleOverload)
                {
                    continue;
                }

                // If no compatible overload found, try to add the previous method by instantiating the model directly.
                if (TryBuildCompatibleMethodForPreviousContract(
                    previousMethod,
                    null,
                    true,
                    compatibilityOverloadSignatures,
                    out var builtMethod))
                {
                    factoryMethods.Add(builtMethod);
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Added back-compat model factory method '{Name}.{previousMethod.Signature.Name}' from last contract.",
                        BackCompatibilityChangeCategory.ModelFactoryMethodAdded);
                }
                else
                {
                    CodeModelGenerator.Instance.Emitter.Info(
                        $"Unable to create a backward compatible model factory method for '{previousMethod.Signature.FullMethodName}'.",
                        BackCompatibilityChangeCategory.ModelFactoryMethodSkipped);
                }
            }
            return [.. factoryMethods];
        }

        private static void RestorePublishedParameterDefaults(
            IReadOnlyList<MethodProvider> factoryMethods,
            IReadOnlyList<MethodProvider> customMethods,
            IReadOnlyList<MethodSignature> previousSignatures)
        {
            var matches = new List<(MethodProvider Current, MethodSignature Previous)>();
            var optionalMethods = factoryMethods.Concat(customMethods)
                .Where(method => HasOptionalParameters(method.Signature))
                .ToHashSet();

            foreach (var method in factoryMethods)
            {
                if (IsRequiredHiddenCompatibilityMethod(method.Signature))
                {
                    continue;
                }

                var previous = previousSignatures.FirstOrDefault(signature =>
                    MethodSignature.MethodSignatureComparer.Equals(signature, method.Signature));
                if (previous is null)
                {
                    continue;
                }

                matches.Add((method, previous));
                if (HasOptionalParameters(previous))
                {
                    optionalMethods.Add(method);
                }
            }

            // Visitors can share parameter objects with the previous contract. Plan every change
            // before applying any, so neither shared objects nor declaration order affect decisions.
            var defaults = new List<(ParameterProvider Parameter, ValueExpression? Value)>();
            foreach (var (current, previous) in matches)
            {
                bool hasOptionalCompetitor = optionalMethods.Any(method =>
                    !ReferenceEquals(method, current) && method.Signature.Name == current.Signature.Name);
                for (int i = 0; i < previous.Parameters.Count; i++)
                {
                    var parameter = current.Signature.Parameters[i];
                    var value = parameter.DefaultValue;
                    if (previous.Parameters[i].DefaultValue is not null)
                    {
                        value ??= Default;
                    }
                    else if (hasOptionalCompetitor)
                    {
                        value = null;
                    }
                    defaults.Add((parameter, value));
                }
            }

            foreach (var (parameter, value) in defaults)
            {
                parameter.DefaultValue = value;
            }
        }

        private static int GetMinimumArgumentCount(MethodSignature signature)
            => signature.Parameters.TakeWhile(parameter => parameter.DefaultValue is null && !parameter.IsParams).Count();

        private static bool HasOptionalParameters(MethodSignature signature)
            => signature.Parameters.Any(parameter => parameter.DefaultValue is not null || parameter.IsParams);

        private static bool IsRequiredHiddenCompatibilityMethod(MethodSignature signature)
        {
            if (HasOptionalParameters(signature))
            {
                return false;
            }

            return signature.Attributes.Any(IsEditorBrowsableNeverAttribute);
        }

        private static bool IsEditorBrowsableNeverAttribute(AttributeStatement attribute)
        {
            if (!attribute.Type.Equals(typeof(EditorBrowsableAttribute)) || attribute.Arguments.Count != 1)
            {
                return false;
            }

            return IsEditorBrowsableNeverState(attribute.Arguments[0]);
        }

        private static bool IsEditorBrowsableNeverState(ValueExpression expression)
        {
            if (expression is ScopedApi scoped)
            {
                expression = scoped.Original;
            }

            return expression switch
            {
                MemberExpression { Inner: TypeReferenceExpression { Type: { } type }, MemberName: nameof(EditorBrowsableState.Never) }
                    => type.Equals(typeof(EditorBrowsableState)),
                LiteralExpression { Literal: int state } => state == (int)EditorBrowsableState.Never,
                LiteralExpression { Literal: EditorBrowsableState state } => state == EditorBrowsableState.Never,
                _ => false,
            };
        }

        private IReadOnlyList<MethodSignature> GetCurrentOverloadSignatures(
            IEnumerable<MethodProvider> methods,
            string methodName)
        {
            return methods
                .Where(m => m.Signature.Name == methodName)
                .Select(m => m.Signature)
                .ToList();
        }

        private static bool HasMatchingExactParameterNames(MethodSignature current, MethodSignature previous)
        {
            if (!MethodSignature.MethodSignatureComparer.Equals(current, previous))
            {
                return false;
            }

            for (int i = 0; i < current.Parameters.Count; i++)
            {
                if (!current.Parameters[i].IsExactName &&
                    current.Parameters[i].Name != previous.Parameters[i].Name)
                {
                    return false;
                }
            }

            return true;
        }

        internal static IReadOnlyList<string> GetUnavailableSignatureTypes(MethodSignature signature)
        {
            var unavailableTypes = new HashSet<string>(StringComparer.Ordinal);
            if (signature.ReturnType != null)
            {
                CollectUnavailableTypes(signature.ReturnType, unavailableTypes);
            }

            foreach (var parameter in signature.Parameters)
            {
                CollectUnavailableTypes(parameter.Type, unavailableTypes);
            }

            return [.. unavailableTypes.OrderBy(type => type, StringComparer.Ordinal)];
        }

        private static void CollectUnavailableTypes(CSharpType type, ISet<string> unavailableTypes)
        {
            foreach (var argument in type.Arguments)
            {
                CollectUnavailableTypes(argument, unavailableTypes);
            }

            if (type.IsFrameworkType)
            {
                return;
            }

            if (TryGetArrayElementName(type, out var elementName))
            {
                if (!IsTypeAvailable(type.Namespace, elementName, type.DeclaringType?.Name))
                {
                    unavailableTypes.Add(string.IsNullOrEmpty(type.Namespace) ? elementName : $"{type.Namespace}.{elementName}");
                }
                return;
            }

            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            if (typeFactory.CSharpTypeMap.Keys.Any(type.AreNamesEqual))
            {
                return;
            }

            var declaringTypeName = type.DeclaringType?.Name;
            if (CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                type.Namespace,
                type.Name,
                declaringTypeName,
                includeReferencedAssemblies: true) != null)
            {
                return;
            }

            unavailableTypes.Add(type.FullyQualifiedName);
        }

        private static bool TryGetArrayElementName(CSharpType type, [NotNullWhen(true)] out string? elementName)
        {
            var bracketIndex = type.Name.IndexOf('[');
            if (bracketIndex <= 0)
            {
                elementName = null;
                return false;
            }

            elementName = type.Name[..bracketIndex];
            return true;
        }

        private static bool IsTypeAvailable(string ns, string name, string? declaringTypeName)
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            if (typeFactory.CSharpTypeMap.Keys.Any(
                type => type.Name == name &&
                    (string.IsNullOrEmpty(ns) || type.Namespace == ns) &&
                    type.DeclaringType?.Name == declaringTypeName))
            {
                return true;
            }

            return CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                ns,
                name,
                declaringTypeName,
                includeReferencedAssemblies: true) != null;
        }

        private bool TryBuildCompatibleMethodForPreviousContract(
            MethodProvider previousMethod,
            MethodSignature? currentMethodSignature,
            bool hideMethod,
            IReadOnlyList<MethodSignature> currentOverloadSignatures,
            [NotNullWhen(true)] out MethodProvider? builtMethod)
        {
            builtMethod = null;
            var previousMethodReturnType = previousMethod.Signature.ReturnType;
            if (previousMethodReturnType is null)
            {
                return false;
            }

            ModelProvider? modelToInstantiate = null;
            foreach (var inputModel in _models)
            {
                var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
                if (modelProvider is null)
                {
                    continue;
                }

                var model = GetModelToInstantiateForPreviousReturnType(modelProvider, previousMethodReturnType);
                if (model != null)
                {
                    modelToInstantiate = model;
                    break;
                }
            }

            if (modelToInstantiate is null)
            {
                return false;
            }

            // BuildBackCompatMethodSignature strips defaults from previousMethod.Signature in place and
            // the signature it returns shares those parameter instances, so capture the published
            // defaults first and restore them if this candidate is rejected below. Without that, a
            // rejected candidate would leave the previous signature partially required for every later
            // attempt, which would over-constrain the fallback shapes.
            var publishedDefaultValues = previousMethod.Signature.Parameters
                .Select(parameter => parameter.DefaultValue)
                .ToArray();

            var signature = MethodSignatureHelper.BuildBackCompatMethodSignature(
                previousMethod.Signature,
                hideMethod,
                currentMethodSignatures: currentOverloadSignatures);

            // Best effort: never emit a compatibility overload that a call could not resolve against
            // a custom overload. Returning false rejects only this candidate; the caller can still
            // try the hidden all-required fallback for a rejected visible replacement and will keep
            // processing other previous signatures.
            if (currentOverloadSignatures.Any(overload => MethodSignatureHelper.AreAmbiguous(signature, overload)))
            {
                for (int i = 0; i < publishedDefaultValues.Length; i++)
                {
                    previousMethod.Signature.Parameters[i].DefaultValue = publishedDefaultValues[i];
                }

                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Skipped model factory method '{Name}.{previousMethod.Signature.Name}' from last contract because it would be ambiguous with a custom overload.",
                    BackCompatibilityChangeCategory.ModelFactoryMethodSkipped);
                return false;
            }

            if (currentMethodSignature != null && TryBuildMethodArgumentsForOverload(previousMethod.Signature, currentMethodSignature, out var arguments))
            {
                var callToOverload = Return(new InvokeMethodExpression(null, currentMethodSignature, arguments));
                builtMethod = new MethodProvider(
                    signature,
                    callToOverload,
                    this,
                    previousMethod.XmlDocs);

                return true;
            }

            MethodBodyStatements body = ConstructMethodBody(previousMethod.Signature, modelToInstantiate);

            builtMethod = new MethodProvider(
                signature,
                body,
                this,
                previousMethod.XmlDocs);

            return true;
        }

        private MethodBodyStatements ConstructMethodBody(MethodSignature signature, ModelProvider modelToInstantiate)
        {
            var collectionInitialization = GetCollectionInitialization(signature);
            var (binaryDataParam, fullCtor) = GetBinaryDataParamAndFullCtorForFactoryMethod(modelToInstantiate);
            var body = new MethodBodyStatements(
            [
                .. collectionInitialization,
                collectionInitialization.Count > 0 ? MethodBodyStatement.EmptyLine : MethodBodyStatement.Empty,
                Return(New.Instance(
                    modelToInstantiate.Type,
                    [ ..GetCtorArgs(modelToInstantiate, signature, fullCtor, binaryDataParam)]))
            ]);
            return body;
        }

        private static bool TryBuildMethodArgumentsForOverload(
            MethodSignature previousMethod,
            MethodSignature currentMethod,
            [NotNullWhen(true)] out IReadOnlyList<ValueExpression>? overloadArguments)
        {
            overloadArguments = null;
            var currentMethodParameterCount = currentMethod.Parameters.Count;
            var previousParameterCount = previousMethod.Parameters.Count;

            if (currentMethodParameterCount <= previousParameterCount || !Equals(previousMethod.ReturnType, currentMethod.ReturnType))
            {
                return false;
            }

            var currentParameters = currentMethod.Parameters.ToHashSet();
            foreach (var parameter in previousMethod.Parameters)
            {
                if (!currentParameters.Contains(parameter))
                {
                    return false;
                }
            }

            // Build the arguments for the overload
            var previousParameters = previousMethod.Parameters.ToHashSet();
            List<ValueExpression> arguments = new(currentMethodParameterCount);

            foreach (var parameter in currentMethod.Parameters)
            {
                if (!previousParameters.TryGetValue(parameter, out var previousParameter))
                {
                    // Parameter not in previous method, use default value
                    arguments.Add(Snippet.PositionalReference(parameter, parameter.DefaultValue ?? Default));
                }
                else
                {
                    arguments.Add(parameter.PositionalReference(previousParameter));
                }
            }

            overloadArguments = arguments;
            return true;
        }

        private static IReadOnlyList<ValueExpression> GetCtorArgs(
            ModelProvider modelProvider,
            MethodSignature factoryMethodSignature,
            ConstructorProvider fullConstructor,
            ParameterProvider? binaryDataParameter)
        {
            var modelCtorFullSignature = fullConstructor.Signature;
            var expressions = new List<ValueExpression>(modelCtorFullSignature.Parameters.Count);

            for (int i = 0; i < modelCtorFullSignature.Parameters.Count; i++)
            {
                var ctorParam = modelCtorFullSignature.Parameters[i];
                if (ReferenceEquals(ctorParam, binaryDataParameter) && !modelProvider.SupportsBinaryDataAdditionalProperties)
                {
                    expressions.Add(binaryDataParameter.PositionalReference(Null));
                    continue;
                }

                var factoryParam = factoryMethodSignature.Parameters.FirstOrDefault(p => p.Name.Equals(ctorParam.Name));
                var defaultExpression = ctorParam.DefaultValue ?? Default;
                if (factoryParam == null)
                {
                    // Check if the param's property has an auto-property initializer.
                    var initExpression = ctorParam.Property?.Body is AutoPropertyBody autoPropertyBody
                        ? autoPropertyBody.InitializationExpression
                        : null;

                    if (initExpression != null)
                    {
                        expressions.Add(initExpression);
                    }
                    else if (ctorParam.Property?.IsDiscriminator == true)
                    {
                        expressions.Add(GetDiscriminatorExpression(ctorParam.Property, modelProvider) ?? defaultExpression);
                    }
                    else
                    {
                        expressions.Add(defaultExpression);
                    }
                }
                else
                {
                    if (IsNonReadOnlyMemoryList(factoryParam))
                    {
                        expressions.Add(factoryParam.ToList());
                    }
                    else if (IsEnumDiscriminator(ctorParam))
                    {
                        expressions.Add(ctorParam.Type.ToEnum(factoryParam));
                    }
                    else
                    {
                        expressions.Add(factoryParam);
                    }
                }
            }

            return [.. expressions];
        }

        private static ValueExpression? GetDiscriminatorExpression(PropertyProvider property, ModelProvider? model)
        {
            if (model == null)
            {
                return null;
            }

            // Make sure we are getting the expression for the correct discriminator property as models may have multiple discriminator
            // from different levels in the hierarchy.
            // The DiscriminatorValueExpression is based on the direct parent model provider discriminator.
            if (model.BaseModelProvider?.DiscriminatorProperty == property)
            {
                return model.DiscriminatorValueExpression;
            }

            return GetDiscriminatorExpression(property, model.BaseModelProvider);
        }

        private static ModelProvider? GetModelToInstantiateForFactoryMethod(ModelProvider modelProvider)
        {
            // Externally-linked models are reused from another shipped package (e.g. the OpenAI .NET
            // SDK), so this library does not own or emit their constructors. Their real constructor
            // surface (accessibility and parameter set) is unknown here; emitting a
            // `new ExternalType(...)` mocking factory produces calls that may be inaccessible
            // (protected/internal) or have a non-matching arity. Skip factory generation for them.
            if (modelProvider.IsExternal)
            {
                return null;
            }

            var fullConstructor = modelProvider.FullConstructor;
            if (modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal)
                || fullConstructor.Signature.Parameters.Any(p => !p.Type.IsPublic && !IsEnumDiscriminator(p)))
            {
                return null;
            }

            return modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? modelProvider.DerivedModels.FirstOrDefault(m => m.IsUnknownDiscriminatorModel
                    && !m.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract))
                : modelProvider;
        }

        private static ModelProvider? GetModelToInstantiateForPreviousReturnType(ModelProvider modelProvider, CSharpType returnType)
        {
            var model = GetModelToInstantiateForFactoryMethod(modelProvider);
            if (model is null)
            {
                return null;
            }

            if (modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract))
            {
                return returnType.AreNamesEqual(modelProvider.Type) || returnType.AreNamesEqual(model.Type)
                    ? model
                    : null;
            }

            return returnType.AreNamesEqual(model.Type)
                ? model
                : null;
        }

        /// <summary>
        /// Selects the serialization constructor and its additional-data parameter for the model factory.
        /// Handwritten constructor parameters lack generated property metadata, so matching discriminator
        /// parameters recover that link by name, type, and passing modifiers. This lets known variants
        /// keep their fixed discriminator while unknown variants expose the caller's value.
        /// </summary>
        private static (ParameterProvider? BinaryDataParam, ConstructorProvider FullCtor) GetBinaryDataParamAndFullCtorForFactoryMethod(
            ModelProvider modelProvider)
        {
            var fullConstructor = modelProvider.FullConstructor;
            var binaryDataParam = fullConstructor.Signature.Parameters.FirstOrDefault(p => p.Name.Equals(AdditionalBinaryDataParameterName));

            // Use a custom constructor if the generated full constructor was suppressed or customized
            if (!modelProvider.Constructors.Contains(fullConstructor))
            {
                foreach (var constructor in modelProvider.CanonicalView.Constructors)
                {
                    var customCtorParamCount = constructor.Signature.Parameters.Count;
                    var fullCtorParamCount = fullConstructor.Signature.Parameters.Count;

                    if (constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal)
                        && customCtorParamCount >= fullCtorParamCount)
                    {
                        foreach (var parameter in constructor.Signature.Parameters)
                        {
                            if (parameter.Property is null && parameter.Field is null)
                            {
                                var generatedParameter = fullConstructor.Signature.Parameters.FirstOrDefault(candidate =>
                                    candidate.Name == parameter.Name &&
                                    candidate.Type.Namespace == parameter.Type.Namespace &&
                                    candidate.IsRef == parameter.IsRef &&
                                    candidate.IsOut == parameter.IsOut &&
                                    candidate.IsIn == parameter.IsIn &&
                                    candidate.IsParams == parameter.IsParams &&
                                    candidate.Type.AreNamesEqual(parameter.Type));
                                if (generatedParameter?.Property is { IsDiscriminator: true } property)
                                {
                                    parameter.Update(property: property);
                                }
                            }
                        }

                        binaryDataParam = constructor.Signature.Parameters
                            .FirstOrDefault(p => p?.Type.Equals(typeof(IDictionary<string, BinaryData>)) == true, binaryDataParam);

                        fullConstructor = constructor;
                        break;
                    }
                }
            }

            return (binaryDataParam, fullConstructor);
        }

        private IReadOnlyList<MethodBodyStatement> GetCollectionInitialization(MethodSignature signature)
        {
            var statements = new List<MethodBodyStatement>();
            foreach (var param in signature.Parameters)
            {
                if (IsNonReadOnlyMemoryList(param) || param.Type.IsDictionary)
                {
                    statements.Add(param.Assign(New.Instance(param.Type.PropertyInitializationType), nullCoalesce: true).Terminate());
                }
            }
            return [.. statements];
        }

        private static IReadOnlyList<ParameterProvider> GetParameters(
            ModelProvider modelProvider,
            ConstructorProvider fullConstructor)
        {
            var modelCtorParams = fullConstructor.Signature.Parameters;
            var parameters = new List<ParameterProvider>(modelCtorParams.Count);
            bool isCustomConstructor = fullConstructor != modelProvider.FullConstructor;

            foreach (var param in modelCtorParams)
            {
                bool isBinaryDataParam = param.Name.Equals(AdditionalBinaryDataParameterName)
                    || (isCustomConstructor && param.Type.Equals(typeof(IDictionary<string, BinaryData>)));

                if ((isBinaryDataParam && !modelProvider.SupportsBinaryDataAdditionalProperties) ||
                    param.Name.Equals(JsonPatchParameterName) && param.IsIn)
                {
                    continue;
                }

                // skip discriminator parameters if the model has a discriminator value as those shouldn't be exposed in the factory methods
                if (param.Property?.IsDiscriminator == true &&
                    modelProvider.DiscriminatorValue != null &&
                    !modelProvider.IsUnknownDiscriminatorModel)
                {
                    continue;
                }

                // Skip required literal and enum parameters as they will have default values assigned in the model constructors
                if (param.Property?.InputProperty is { IsRequired: true, Type: InputLiteralType or InputEnumTypeValue })
                {
                    continue;
                }

                parameters.Add(GetModelFactoryParam(param));
            }
            return [.. parameters];
        }

        private static ParameterProvider GetModelFactoryParam(ParameterProvider parameter)
        {
            return new ParameterProvider(
                parameter.Name,
                parameter.Description,
                // in order to avoid exposing discriminator enums as public, we will use the underlying types in the model factory methods
                // Resolve generated types referenced by custom constructors before converting to the input collection shape.
                IsEnumDiscriminator(parameter)
                    ? parameter.Type.UnderlyingEnumType
                    : parameter.Type.ApplyInputSpecProperty(null).InputType,
                Default,
                parameter.IsRef,
                parameter.IsOut,
                parameter.IsIn,
                parameter.IsParams,
                parameter.Attributes,
                parameter.Property,
                parameter.Field,
                parameter.InitializationValue)
            {
                Validation = ParameterValidationType.None,
            };
        }

        private static bool IsEnumDiscriminator(ParameterProvider parameter) =>
            parameter.Property?.IsDiscriminator == true && parameter.Type.IsEnum;

        private static bool IsNonReadOnlyMemoryList(ParameterProvider parameter) =>
            parameter.Type is { IsList: true, IsReadOnlyMemory: false };
    }
}
