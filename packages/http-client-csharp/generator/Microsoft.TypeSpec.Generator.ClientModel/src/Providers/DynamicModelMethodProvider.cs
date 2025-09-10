// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal class DynamicModelMethodProvider
    {
        private readonly ScmModelProvider _model;

        public DynamicModelMethodProvider(ScmModelProvider model)
        {
            _model = model;
        }

        public MethodProvider[] BuildMethods()
        {
            return
            [
                BuildPropagateGetMethod(),
                BuildPropagateSetMethod()
            ];
        }

        private MethodProvider BuildPropagateGetMethod()
        {
            var jsonPathParameter = new ParameterProvider("jsonPath", $"", typeof(ReadOnlySpan<byte>));
#pragma warning disable SCME0001
            var valueParameter = new ParameterProvider("value", $"", typeof(JsonPatch.EncodedValue), isOut: true);
#pragma warning restore SCME0001

            var signature = new MethodSignature(
                "PropagateGet",
                $"",
                MethodSignatureModifiers.Private,
                typeof(bool),
                $"",
                [jsonPathParameter, valueParameter]);

            var bodyStatements = new MethodBodyStatement[]
            {
                Declare("local", typeof(ReadOnlySpan<byte>), jsonPathParameter.Invoke("SliceToStartOfPropertyName"),
                    out var localVariable),
                valueParameter.Assign(Default).Terminate(),
                BuildDynamicPropertyIfStatements(localVariable, valueParameter, propagateGet: true), Return(False)
            };
            return new MethodProvider(
                signature,
                bodyStatements,
                _model,
                suppressions: [ScmModelProvider.JsonPatchSuppression]);
        }

        private MethodProvider BuildPropagateSetMethod()
        {
            var jsonPathParameter = new ParameterProvider("jsonPath", $"", typeof(ReadOnlySpan<byte>));
#pragma warning disable SCME0001
            var valueParameter = new ParameterProvider("value", $"", typeof(JsonPatch.EncodedValue));
#pragma warning restore SCME0001

            var signature = new MethodSignature(
                "PropagateSet",
                $"",
                MethodSignatureModifiers.Private,
                typeof(bool),
                $"",
                [jsonPathParameter, valueParameter]);

            var bodyStatements = new MethodBodyStatement[]
            {
                Declare("local", typeof(ReadOnlySpan<byte>), jsonPathParameter.Invoke("SliceToStartOfPropertyName"),
                    out var localVariable),
                BuildDynamicPropertyIfStatements(localVariable, valueParameter, propagateGet: false), Return(False)
            };
            return new MethodProvider(
                signature,
                bodyStatements,
                _model,
                suppressions: [ScmModelProvider.JsonPatchSuppression]);
        }

        private MethodBodyStatement[] BuildDynamicPropertyIfStatements(
            VariableExpression localVariable,
            ParameterProvider valueParameter,
            bool propagateGet)
        {
            var dynamicProperties = _model.Properties.Where(p =>
                ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(p.Type, out var provider) &&
                provider is ScmModelProvider { IsDynamicModel: true });
            var statements = new List<MethodBodyStatement>();

            foreach (var property in dynamicProperties)
            {
#pragma warning disable SCME0001
                var patchProperty = ((MemberExpression)property).Property("Patch").As<JsonPatch>();
#pragma warning restore SCME0001
                statements.Add(
                    new IfStatement(localVariable.Invoke("StartsWith", LiteralU8(property.WireInfo!.SerializedName)))
                    {
                        propagateGet
                            ? Return(patchProperty.TryGetEncodedValue(
                                IndexerExpression.FromCollection(
                                    Spread(LiteralU8("$")),
                                    Spread(ReadOnlySpanSnippets.Slice(
                                        localVariable,
                                        LiteralU8(property.WireInfo!.SerializedName).Property("Length")))),
                                valueParameter))
                            : new MethodBodyStatement[]
                            {
                                    patchProperty.Set(
                                    IndexerExpression.FromCollection(
                                        Spread(LiteralU8("$")),
                                        Spread(ReadOnlySpanSnippets.Slice(
                                            localVariable,
                                            LiteralU8(property.WireInfo!.SerializedName).Property("Length")))),
                                    valueParameter),
                                Return(True)
                            }
                    });
            }

            var dynamicCollectionProperties = _model.Properties
                .Where(p => p.Type.IsCollection)
                .Where(p => ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(
                    p.Type.GetNestedElementType(),
                    out var provider) &&
                    provider is ScmModelProvider { IsDynamicModel: true });

            foreach (var property in dynamicCollectionProperties)
            {
                var indexableProperty = new IndexableExpression(property);
                statements.Add(
                    new IfStatement(
                        localVariable.Invoke("StartsWith", LiteralU8(property.WireInfo!.SerializedName)))
                    {
                        BuildCollectionIfStatements(
                            property,
                            propagateGet,
                            valueParameter,
                            localVariable)
                    });
            }

            if (statements.Count > 0)
            {
                statements.Insert(0, MethodBodyStatement.EmptyLine);
            }

            return [..statements];
        }

        private MethodBodyStatement[] BuildCollectionIfStatements(
            PropertyProvider property,
            bool propagateGet,
            ParameterProvider valueParameter,
            VariableExpression localVariable)
        {
            var statements = new List<MethodBodyStatement>();
            var currentType = property.Type;
            var accessorChain = new List<ValueExpression> { new IndexableExpression(property) };
            ValueExpression? remainderSlice = null;

            statements.Add(Declare("propertyLength", typeof(int),
                LiteralU8(property.WireInfo!.SerializedName).Property("Length"),
                out var propertyLength));

            statements.Add(Declare("currentSlice", typeof(ReadOnlySpan<byte>),
                localVariable.Invoke("Slice", propertyLength), out var currentSlice));

            // Parse each level of nesting while we still have collections
            while (currentType.IsCollection)
            {
                bool hasNestedCollection = currentType.ElementType.IsCollection;

                if (currentType.IsList || currentType.IsArray)
                {
                    statements.Add(new IfStatement(Not(currentSlice.Invoke(
                        "TryGetIndex",
                        [
                            new DeclarationExpression(typeof(int), "index", out var indexVariable, isOut: true),
                            new DeclarationExpression(typeof(int), "bytesConsumed", out var bytesConsumedVariable, isOut: true)
                        ]).As<bool>()))
                    {
                        Return(False)
                    });

                    accessorChain.Add(new IndexerExpression(accessorChain.Last(), indexVariable));

                    if (hasNestedCollection)
                    {
                        statements.Add(currentSlice.Assign(ReadOnlySpanSnippets.Slice(currentSlice, bytesConsumedVariable)).Terminate());
                    }
                    else
                    {
                        remainderSlice = ReadOnlySpanSnippets.Slice(currentSlice, bytesConsumedVariable);
                    }
                }
                else if (currentType.IsDictionary)
                {
                    statements.Add(Declare("key", typeof(string),
                        JsonPatchSnippets.GetFirstPropertyName(
                            currentSlice,
                            new DeclarationExpression(typeof(int), "i", out var index, isOut: true)),
                        out var keyVariable));

                    statements.Add(new IfStatement(Not(accessorChain.Last().Invoke(
                        "TryGetValue",
                        keyVariable,
                        new DeclarationExpression(currentType.ElementType, "item", out var itemVariable, isOut: true))))
                    {
                        Return(False)
                    });

                    accessorChain.Add(itemVariable);

                    if (hasNestedCollection)
                    {
                        statements.Add(currentSlice.Assign(JsonPatchSnippets.GetRemainder(currentSlice, index)).Terminate());
                    }
                    else
                    {
                        remainderSlice = JsonPatchSnippets.GetRemainder(currentSlice, index);
                    }
                }

                currentType = currentType.ElementType;
            }

            var finalAccessor = accessorChain.Last();
#pragma warning disable SCME0001
            var patchProperty = finalAccessor.Property("Patch").As<JsonPatch>();
#pragma warning restore SCME0001

            statements.Add(propagateGet
                ? Return(patchProperty.TryGetEncodedValue(
                    IndexerExpression.FromCollection(
                        Spread(LiteralU8("$")),
                        Spread(remainderSlice!)),
                    valueParameter))
                : patchProperty.Set(
                    IndexerExpression.FromCollection(
                        Spread(LiteralU8("$")),
                        Spread(remainderSlice!)),
                    valueParameter));

            if (!propagateGet)
            {
                statements.Add(Return(True));
            }

            return [.. statements];
        }
    }
}
