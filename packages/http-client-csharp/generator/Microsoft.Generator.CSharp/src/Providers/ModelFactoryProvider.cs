// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal class ModelFactoryProvider : TypeProvider
    {
        private const string ModelFactorySuffix = "ModelFactory";
        private const string AdditionalBinaryDataParameterName = "additionalBinaryDataProperties";

        private readonly IEnumerable<InputModelType> _models;

        public static ModelFactoryProvider FromInputLibrary() => new ModelFactoryProvider(CodeModelPlugin.Instance.InputLibrary.InputNamespace.Models);

        private ModelFactoryProvider(IEnumerable<InputModelType> models)
        {
            _models = models;
        }

        protected override string BuildName()
        {
            var span = CodeModelPlugin.Instance.Configuration.LibraryName.AsSpan();
            if (span.IndexOf('.') == -1)
                return string.Concat(CodeModelPlugin.Instance.Configuration.LibraryName, ModelFactorySuffix);

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

        protected override TypeSignatureModifiers GetDeclarationModifiers()
            => TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

        protected override XmlDocProvider BuildXmlDocs()
        {
            var docs = new XmlDocProvider();
            docs.Summary = new XmlDocSummaryStatement(
                [$"A factory class for creating instances of the models for mocking."]);
            return docs;
        }

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>(_models.Count());
            foreach (var model in _models)
            {
                var modelProvider = CodeModelPlugin.Instance.TypeFactory.CreateModel(model);
                if (modelProvider is null || modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal))
                    continue;

                var typeToInstantiate = modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                    ? modelProvider.DerivedModels.FirstOrDefault(m => m.IsUnknownDiscriminatorModel)
                    : modelProvider;
                if (typeToInstantiate is null)
                    continue;

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

                            if (customCtorParamCount > fullCtorParamCount)
                            {
                                fullConstructor = constructor;
                                break;
                            }
                        }
                    }
                }

                var signature = new MethodSignature(
                    modelProvider.Name,
                    null,
                    MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                    modelProvider.Type,
                    $"A new {modelProvider.Type:C} instance for mocking.",
                    GetParameters(modelProvider, fullConstructor));

                var docs = new XmlDocProvider();
                docs.Summary = modelProvider.XmlDocs?.Summary;
                docs.Returns = new XmlDocReturnsStatement($"A new {modelProvider.Type:C} instance for mocking.");
                foreach (var param in signature.Parameters)
                {
                    docs.Params.Add(new XmlDocParamStatement(param.Name, param.Description));
                }

                var statements = new MethodBodyStatements(
                [
                    .. GetCollectionInitialization(signature),
                    MethodBodyStatement.EmptyLine,
                    Return(New.Instance(typeToInstantiate.Type, [.. GetCtorArgs(modelProvider, signature, fullConstructor, binaryDataParam)]))
                ]);

                methods.Add(new MethodProvider(signature, statements, this, docs));
            }
            return [.. methods];
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

            if (binaryDataParameter != null && !modelProvider.SupportsBinaryDataAdditionalProperties)
            {
                expressions.Add(binaryDataParameter.PositionalReference(Null));
            }

            return [.. expressions];
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
