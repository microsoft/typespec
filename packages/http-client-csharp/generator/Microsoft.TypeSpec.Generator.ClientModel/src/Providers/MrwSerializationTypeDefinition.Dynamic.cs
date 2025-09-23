// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.ClientModel.Utilities;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public partial class MrwSerializationTypeDefinition
    {
        internal static ValueExpression GetDeserializationMethodInvocationForType(
            CSharpType modelType,
            ScopedApi<JsonElement> jsonElementVariable,
            ValueExpression dataVariable,
            ValueExpression? optionsVariable = null)
        {
            return ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(modelType, out var provider) &&
                provider is ModelProvider modelProvider
                ? GetDeserializationMethodInvocationForType(modelProvider, jsonElementVariable, dataVariable, optionsVariable)
                : modelType.Deserialize(jsonElementVariable, null, optionsVariable);
        }

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
        private MethodBodyStatement CreateDictionarySerializationWithPatch(
            DictionaryExpression dictionary,
            SerializationFormat serializationFormat,
            ScopedApi<JsonPatch> patchSnippet,
            string serializedName,
            List<ValueExpression>? parentIndices = null)
        {
            parentIndices ??= [];

            var jsonPathTemplate = BuildJsonPathForElement(serializedName, parentIndices);
            ValueExpression jsonPath = parentIndices.Count > 0
                ? Utf8Snippets.GetBytes(new FormattableStringExpression(jsonPathTemplate, [.. parentIndices]).As<string>())
                : LiteralU8($"$.{serializedName}");

            var foreachStatement = new ForEachStatement("item", dictionary, out KeyValuePairExpression keyValuePair);

            const int BufferSize = 256;
            var bufferDeclaration = Declare(
                "buffer",
                new CSharpType(typeof(Span<byte>)),
                New.Array(typeof(byte), isStackAlloc: true, Int(BufferSize)),
                out var bufferVar);
            var bytesWrittenDeclaration = Declare(
                "bytesWritten",
                typeof(int),
                Utf8Snippets.GetBytes(keyValuePair.Key.Invoke("AsSpan"), bufferVar),
                out var bytesWrittenVar);
            var patchContainsKey = patchSnippet.Contains(jsonPath, Utf8Snippets.GetBytes(keyValuePair.Key.As<string>()));
            var patchContainsNet8Declaration = Declare(
                "patchContains",
                typeof(bool),
                new TernaryConditionalExpression(
                    bytesWrittenVar.Equal(Int(BufferSize)),
                    patchContainsKey,
                    patchSnippet.Contains(
                        jsonPath,
                        ReadOnlySpanSnippets.Slice(bufferVar, Int(0), bytesWrittenVar))),
                out var patchContainsNet8Var);

            List<ValueExpression> childIndices = keyValuePair.ValueType.IsCollection
                ? [.. parentIndices, keyValuePair.Key]
                : parentIndices;

            // Process key-value pair if patch doesn't contain it
            var ifPatchDoesNotContainStatement = new IfStatement(Not(patchContainsNet8Var))
            {
                _utf8JsonWriterSnippet.WritePropertyName(keyValuePair.Key),
                CreateElementSerializationWithPatch(
                    keyValuePair.Value,
                    keyValuePair.ValueType,
                    patchSnippet,
                    serializationFormat,
                    serializedName,
                    childIndices)
            };

            var innerIfElseProcessorStatement = new IfElsePreprocessorStatement(
                "NET8_0_OR_GREATER",
                new MethodBodyStatement[] { bytesWrittenDeclaration, patchContainsNet8Declaration },
                new DeclarationExpression(new VariableExpression(patchContainsNet8Var.Type, patchContainsNet8Var.Declaration))
                    .Assign(patchContainsKey)
                    .Terminate());

            foreachStatement.Add(innerIfElseProcessorStatement);
            foreachStatement.Add(ifPatchDoesNotContainStatement);

            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartObject(),
                new IfElsePreprocessorStatement("NET8_0_OR_GREATER", bufferDeclaration),
                foreachStatement,
                MethodBodyStatement.EmptyLine,
                patchSnippet.WriteTo(_utf8JsonWriterSnippet, jsonPath).Terminate(),
                _utf8JsonWriterSnippet.WriteEndObject(),
            };
        }

        private MethodBodyStatement CreateListSerializationWithPatch(
    ValueExpression collection,
    CSharpType type,
    ScopedApi<JsonPatch> patchSnippet,
    SerializationFormat serializationFormat,
    string serializedName,
    List<ValueExpression>? parentIndices = null)
        {
            parentIndices ??= [];
            var indexDeclaration = Declare<int>("i", out var indexVar);
            var allIndices = new List<ValueExpression>(parentIndices) { indexVar };
            var jsonPathTemplate = BuildJsonPathForElement(serializedName, parentIndices);
            ScopedApi<bool> patchIsRemovedCondition;

            // Handle model types with their own patch property
            if (ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(type, out var provider) &&
                provider is ScmModelProvider scmModelProvider && scmModelProvider.JsonPatchProperty != null)
            {
                patchIsRemovedCondition = new IndexerExpression(collection, indexVar)
                    .Property(scmModelProvider.JsonPatchProperty.Name)
                    .As<JsonPatch>()
                    .IsRemoved(LiteralU8("$"));
            }
            else
            {
                patchIsRemovedCondition = patchSnippet.IsRemoved(
                    Utf8Snippets.GetBytes(
                        new FormattableStringExpression(jsonPathTemplate + $"[{{{parentIndices.Count}}}]", allIndices)
                    .As<string>()));
            }

            var forStatement = new ForStatement(
                indexDeclaration.Assign(Literal(0)),
                indexVar.LessThan(collection.Property(type.IsArray ? "Length" : "Count")),
                indexVar.Increment())
            {
                new MethodBodyStatement[]
                {
                    new IfStatement(patchIsRemovedCondition) { Continue },
                    CreateElementSerializationWithPatch(
                        new IndexerExpression(collection, indexVar),
                        type,
                        patchSnippet,
                        serializationFormat,
                        serializedName,
                        allIndices)
                }
            };

            var writeToPatchStatement = parentIndices.Count == 0
                ? patchSnippet.WriteTo(_utf8JsonWriterSnippet, LiteralU8(jsonPathTemplate)).Terminate()
                : patchSnippet.WriteTo(_utf8JsonWriterSnippet, Utf8Snippets.GetBytes(new FormattableStringExpression(jsonPathTemplate, parentIndices).As<string>())).Terminate();

            return new[]
            {
                _utf8JsonWriterSnippet.WriteStartArray(),
                forStatement,
                writeToPatchStatement,
                _utf8JsonWriterSnippet.WriteEndArray()
            };
        }

        private MethodBodyStatement CreateElementSerializationWithPatch(
            ValueExpression element,
            CSharpType elementType,
            ScopedApi<JsonPatch> patchSnippet,
            SerializationFormat serializationFormat,
            string serializedName,
            List<ValueExpression> currentIndices)
        {
            var nestedSerialization = elementType switch
            {
                { IsList: true } or { IsArray: true } => CreateListSerializationWithPatch(
                    element,
                    elementType.Arguments[0],
                    patchSnippet,
                    serializationFormat,
                    serializedName,
                    currentIndices),
                { IsDictionary: true } => CreateDictionarySerializationWithPatch(
                    new DictionaryExpression(elementType, element),
                    serializationFormat,
                    patchSnippet,
                    serializedName,
                    currentIndices),
                _ => null
            };

            if (nestedSerialization != null)
            {
                return TypeRequiresNullCheckInSerialization(elementType)
                    ? new[]
                    {
                        new IfStatement(element.Equal(Null)) { _utf8JsonWriterSnippet.WriteNullValue(), Continue },
                        nestedSerialization
                    }
                    : nestedSerialization;
            }

            return CreateNullCheckAndSerializationStatement(
                elementType,
                element,
                serializationFormat,
                serializedName);
        }

        private IfElseStatement CreateConditionalPatchSerializationStatement(
            string serializedName,
            ScopedApi<bool>? condition,
            MethodBodyStatement writePropertySerializationStatement,
            MethodBodyStatement? elseStatementBody)
        {
            string jsonPath = $"$.{serializedName}";
            var ifPatchIsNotRemoved = new IfStatement(Not(_jsonPatchProperty!.As<JsonPatch>().IsRemoved(LiteralU8(jsonPath))))
            {
                _utf8JsonWriterSnippet.WritePropertyName(serializedName),
                _utf8JsonWriterSnippet.WriteRawValue(
                    JsonPatchSnippets.GetJson(_jsonPatchProperty!.As<JsonPatch>(),
                    LiteralU8(jsonPath)))
            };
            var ifPatchContainsJson = new IfStatement(_jsonPatchProperty!.As<JsonPatch>().Contains(LiteralU8(jsonPath)))
            {
                ifPatchIsNotRemoved
            };

            if (condition == null)
            {
                return new IfElseStatement(ifPatchContainsJson, [], elseStatementBody);
            }

            var elseifPropertyIsDefined = new IfStatement(condition)
            {
                writePropertySerializationStatement
            };
            return new IfElseStatement(ifPatchContainsJson, [elseifPropertyIsDefined], elseStatementBody);
        }

        private MethodProvider BuildPropagateGetMethod()
        {
            var jsonPathParameter = new ParameterProvider("jsonPath", $"", typeof(ReadOnlySpan<byte>));
            var valueParameter = new ParameterProvider("value", $"", typeof(JsonPatch.EncodedValue), isOut: true);

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
            var valueParameter = new ParameterProvider("value", $"", typeof(JsonPatch.EncodedValue));

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
                provider is ScmModelProvider { JsonPatchProperty: not null });
            var statements = new List<MethodBodyStatement>();

            foreach (var property in dynamicProperties)
            {
                var patchProperty = ((MemberExpression)property).Property("Patch").As<JsonPatch>();
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
                    provider is ScmModelProvider { JsonPatchProperty: not null });

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

            return [.. statements];
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
            var patchProperty = finalAccessor.Property("Patch").As<JsonPatch>();

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
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

        private static string BuildJsonPathForElement(string propertySerializedName, List<ValueExpression> indices)
        {
            var count = indices.Count;
            if (count == 0)
            {
                return $"$.{propertySerializedName}";
            }

            var result = $"$.{propertySerializedName}";
            for (int i = 0; i < count; i++)
            {
                result += indices[i] is MemberExpression
                    ? $"[\\\"{{{i}}}\\\"]"
                    : $"[{{{i}}}]";
            }

            return result;
        }

        private static ValueExpression GetDeserializationMethodInvocationForType(
            ModelProvider model,
            ScopedApi<JsonElement> jsonElementVariable,
            ValueExpression dataVariable,
            ValueExpression? optionsVariable = null)
        {
            optionsVariable ??= ModelSerializationExtensionsSnippets.Wire;
            return model is ScmModelProvider { HasDynamicModelSupport: true }
                ? model.Type.Deserialize(jsonElementVariable, dataVariable, optionsVariable)
                : model.Type.Deserialize(jsonElementVariable, null, optionsVariable);
        }
    }
}
