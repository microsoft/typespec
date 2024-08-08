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
        private const string AdditionalRawDataParameterName = "serializedAdditionalRawData";

        private readonly IEnumerable<InputModelType> _models;

        public ModelFactoryProvider(IEnumerable<InputModelType> models)
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

                var modelCtor = GetSecondaryConstructor(modelProvider);
                if (modelCtor == null)
                {
                    throw new InvalidOperationException($"Unable to find the secondary constructor for the model {modelProvider.Name}.");
                }

                var statements = new MethodBodyStatements(
                [
                    .. GetCollectionInitialization(signature),
                    MethodBodyStatement.EmptyLine,
                    Return(New.Instance(modelCtor.Signature, [.. GetCtorParams(modelCtor.Signature, signature)]))
                ]);

                methods.Add(new MethodProvider(signature, statements, this, docs));
            }
            return [.. methods];
        }

        private static IReadOnlyList<ValueExpression> GetCtorParams(
            ConstructorSignature modelProviderCtor,
            MethodSignature modelFactoryMethod)
        {
            var modelProviderCtorParams = modelProviderCtor.Parameters;
            var modelFactoryMethodParams = modelFactoryMethod.Parameters.ToDictionary(p => p.Name);
            var expressions = new List<ValueExpression>(modelProviderCtorParams.Count);

            foreach (var param in modelProviderCtorParams)
            {
                if (modelFactoryMethodParams.TryGetValue(param.Name, out var factoryMethodParam))
                {
                    ValueExpression expression = factoryMethodParam.Type.IsList
                        ? factoryMethodParam.NullConditional().ToList()
                        : factoryMethodParam;
                    expressions.Add(expression);
                }
                else
                {
                    expressions.Add(Null);
                }
            }

            return [.. expressions];
        }

        private IReadOnlyList<MethodBodyStatement> GetCollectionInitialization(MethodSignature signature)
        {
            var statements = new List<MethodBodyStatement>();
            foreach (var param in signature.Parameters)
            {
                if (param.Type.IsList)
                {
                    statements.Add(param.Assign(New.Instance(new CSharpType(typeof(List<>), param.Type.Arguments))).Terminate());
                }
                else if (param.Type.IsDictionary)
                {
                    statements.Add(param.Assign(New.Instance(new CSharpType(typeof(Dictionary<,>), param.Type.Arguments))).Terminate());
                }
            }
            return [.. statements];
        }

        private IReadOnlyList<ParameterProvider> GetParameters(TypeProvider modelProvider)
        {
            var parameters = new List<ParameterProvider>(modelProvider.Properties.Count);
            foreach (var property in modelProvider.Properties)
            {
                if (property.Modifiers.HasFlag(MethodSignatureModifiers.Internal))
                    continue;

                parameters.Add(GetModelFactoryParam(property.AsParameter));
            }
            return [.. parameters];
        }

        private ParameterProvider GetModelFactoryParam(ParameterProvider parameter)
        {
            return new ParameterProvider(
                parameter.Name,
                parameter.Description,
                parameter.Type.InputType,
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

        private static ConstructorProvider? GetSecondaryConstructor(TypeProvider model)
        {
            if (model.Constructors.Count == 1)
            {
                return model.Constructors[0];
            }

            return model.Constructors.FirstOrDefault(ctor =>
                ctor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal) &&
                ctor.Signature.Parameters.Any(p => p.Name == AdditionalRawDataParameterName));
        }
    }
}
