// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class ModelFactoryProvider : TypeProvider
    {
        private const string ModelFactorySuffix = "ModelFactory";
        private const string AdditionalBinaryDataParameterName = "additionalBinaryDataProperties";

        private readonly IEnumerable<InputModelType> _models;

        internal ModelFactoryProvider(IEnumerable<InputModelType> models)
        {
            _models = models;
        }

        protected override string BuildName()
        {
            var span = CodeModelGenerator.Instance.Configuration.PackageName.AsSpan();
            if (span.IndexOf('.') == -1)
                return string.Concat(CodeModelGenerator.Instance.Configuration.PackageName, ModelFactorySuffix);

            Span<char> dest = stackalloc char[span.Length + ModelFactorySuffix.Length];
            int j = 0;

            for (int i = 0; i < span.Length; i++)
            {
                if (span[i] != '.')
                {
                    dest[j] = span[i];
                    j++;
                }
            }
            ModelFactorySuffix.AsSpan().CopyTo(dest.Slice(j));
            return dest.Slice(0, j + ModelFactorySuffix.Length).ToString();
        }

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

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>(_models.Count());
            foreach (var model in _models)
            {
                var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model);

                if (modelProvider is null)
                    continue;

                var typeToInstantiate = GetModelToInstantiateForFactoryMethod(modelProvider);
                if (typeToInstantiate is null)
                {
                    continue;
                }

                var (binaryDataParam, fullConstructor) = GetBinaryDataParamAndFullCtorForFactoryMethod(modelProvider);
                var signature = new MethodSignature(
                    modelProvider.Name,
                    null,
                    MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                    modelProvider.Type,
                    $"A new {modelProvider.Type:C} instance for mocking.",
                    GetParameters(modelProvider, fullConstructor));

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

                methods.Add(new MethodProvider(signature, statements, this, docs));
            }

            return [.. methods, .. BuildMethodsForBackCompatability(methods)];
        }

        private MethodProvider[] BuildMethodsForBackCompatability(List<MethodProvider> methods)
        {
            if (LastContractView?.Methods == null || LastContractView.Methods.Count == 0)
            {
                return [];
            }

            List<MethodProvider> methodsToAdd = [];
            HashSet<MethodSignature> currentMethodSignatures = new List<MethodProvider>([.. methods, .. CustomCodeView?.Methods ?? []])
               .Select(m => m.Signature)
               .ToHashSet(MethodSignature.MethodSignatureComparer);

            foreach (var previousMethod in LastContractView.Methods)
            {
                if (currentMethodSignatures.Contains(previousMethod.Signature))
                {
                    continue;
                }

                List<MethodSignature> currentOverloads = [];
                // Attempt to find an updated method in the current contract to call
                foreach (var currentMethodSignature in currentMethodSignatures)
                {
                    if (currentMethodSignature.Name.Equals(previousMethod.Signature.Name))
                    {
                        currentOverloads.Add(currentMethodSignature);
                    }
                }

                bool foundCompatibleOverload = false;
                foreach (var currentOverload in currentOverloads)
                {
                    if (TryBuildMethodArgumentsForOverload(previousMethod.Signature, currentOverload, out var arguments))
                    {
                        var signature = new MethodSignature(
                            previousMethod.Signature.Name,
                            previousMethod.Signature.Description,
                            previousMethod.Signature.Modifiers,
                            previousMethod.Signature.ReturnType,
                            previousMethod.Signature.ReturnDescription,
                            previousMethod.Signature.Parameters,
                            Attributes: [new AttributeStatement(typeof(EditorBrowsableAttribute), FrameworkEnumValue(EditorBrowsableState.Never))]);

                        var callToOverload = Return(new InvokeMethodExpression(null, currentOverload, arguments));
                        methodsToAdd.Add(new MethodProvider(
                            signature,
                            callToOverload,
                            this,
                            previousMethod.XmlDocs));
                        foundCompatibleOverload = true;
                        break;
                    }
                }

                if (foundCompatibleOverload)
                {
                    continue;
                }

                // If no compatible overload found, try to add the previous method by instantiating the model directly.
                if (TryBuildCompatibleMethodForPreviousContract(previousMethod, out var builtMethod))
                {
                    methodsToAdd.Add(builtMethod);
                }
                else
                {
                    CodeModelGenerator.Instance.Emitter.Info($"Unable to create a backward compatible model factory method for {previousMethod.Signature.FullMethodName}.");
                }
            }

            return [.. methodsToAdd];
        }

        private bool TryBuildCompatibleMethodForPreviousContract(
            MethodProvider previousMethod,
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

                var model = GetModelToInstantiateForFactoryMethod(modelProvider);
                if (model != null && previousMethodReturnType.AreNamesEqual(model.Type))
                {
                    modelToInstantiate = model;
                    break;
                }
            }

            if (modelToInstantiate is null)
            {
                return false;
            }

            MethodBodyStatements body = ConstructMethodBody(previousMethod.Signature, modelToInstantiate);

            builtMethod = new MethodProvider(
                previousMethod.Signature,
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
                    arguments.Add(previousParameter);
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
                    else if (ctorParam.Property?.IsDiscriminator == true && modelProvider.DiscriminatorValueExpression != null)
                    {
                        expressions.Add(modelProvider.DiscriminatorValueExpression);
                    }
                    else
                    {
                        expressions.Add(ctorParam.DefaultValue ?? Default);
                    }
                }
                else
                {
                    if (IsNonReadOnlyMemoryList(factoryParam))
                    {
                        expressions.Add(factoryParam.NullConditional().ToList());
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

        private static ModelProvider? GetModelToInstantiateForFactoryMethod(ModelProvider modelProvider)
        {
            var fullConstructor = modelProvider.FullConstructor;
            if (modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal)
                || fullConstructor.Signature.Parameters.Any(p => !p.Type.IsPublic))
            {
                return null;
            }

            return modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? modelProvider.DerivedModels.FirstOrDefault(m => m.IsUnknownDiscriminatorModel)
                : modelProvider;
        }

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

                if (isBinaryDataParam && !modelProvider.SupportsBinaryDataAdditionalProperties)
                    continue;

                // skip discriminator parameters if the model has a discriminator value as those shouldn't be exposed in the factory methods
                if (param.Property?.IsDiscriminator == true && modelProvider.DiscriminatorValue != null)
                    continue;

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
                IsEnumDiscriminator(parameter) ? parameter.Type.UnderlyingEnumType : parameter.Type.InputType,
                Default,
                parameter.IsRef,
                parameter.IsOut,
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
