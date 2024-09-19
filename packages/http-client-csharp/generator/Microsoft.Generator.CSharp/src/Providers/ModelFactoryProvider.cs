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
            => TypeSignatureModifiers.Static | TypeSignatureModifiers.Public | TypeSignatureModifiers.Class | TypeSignatureModifiers.Partial;

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
                    ? modelProvider.DerivedModels.First(m => m.IsUnknownDiscriminatorModel)
                    : modelProvider;

                var modelCtor = modelProvider.FullConstructor;
                var signature = new MethodSignature(
                    modelProvider.Name,
                    null,
                    MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                    modelProvider.Type,
                    $"A new {modelProvider.Type:C} instance for mocking.",
                    GetParameters(modelProvider));

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
                    Return(New.Instance(typeToInstantiate.Type, [.. GetCtorArgs(modelProvider, signature)]))
                ]);

                methods.Add(new MethodProvider(signature, statements, this, docs));
            }
            return [.. methods];
        }

        private static IReadOnlyList<ValueExpression> GetCtorArgs(
            ModelProvider modelProvider,
            MethodSignature factoryMethodSignature)
        {
            var modelCtorFullSignature = modelProvider.FullConstructor.Signature;
            var expressions = new List<ValueExpression>(modelCtorFullSignature.Parameters.Count);

            for (int i = 0; i < modelCtorFullSignature.Parameters.Count; i++)
            {
                var ctorParam = modelCtorFullSignature.Parameters[i];
                var factoryParam = factoryMethodSignature.Parameters.FirstOrDefault(p => p.Name.Equals(ctorParam.Name));
                if (factoryParam == null && ctorParam.Property?.IsDiscriminator == true && modelProvider.DiscriminatorValueExpression != null)
                {
                    expressions.Add(modelProvider.DiscriminatorValueExpression);
                    continue;
                }
                else if (factoryParam != null)
                {
                    if (factoryParam.Type.IsList)
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

            if (modelCtorFullSignature.Parameters.Any(p => p.Name.Equals(AdditionalBinaryDataParameterName)) &&
                !modelProvider.SupportsBinaryDataAdditionalProperties)
            {
                expressions.Add(Null);
            }

            return [.. expressions];
        }

        private IReadOnlyList<MethodBodyStatement> GetCollectionInitialization(MethodSignature signature)
        {
            var statements = new List<MethodBodyStatement>();
            foreach (var param in signature.Parameters)
            {
                if (param.Type.IsList || param.Type.IsDictionary)
                {
                    statements.Add(param.Assign(New.Instance(param.Type.PropertyInitializationType), nullCoalesce: true).Terminate());
                }
            }
            return [.. statements];
        }

        private static IReadOnlyList<ParameterProvider> GetParameters(ModelProvider modelProvider)
        {
            var modelCtorParams = modelProvider.FullConstructor.Signature.Parameters;
            var parameters = new List<ParameterProvider>(modelCtorParams.Count);
            foreach (var param in modelCtorParams)
            {
                if (param.Name.Equals(AdditionalBinaryDataParameterName) && !modelProvider.SupportsBinaryDataAdditionalProperties)
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
    }
}
