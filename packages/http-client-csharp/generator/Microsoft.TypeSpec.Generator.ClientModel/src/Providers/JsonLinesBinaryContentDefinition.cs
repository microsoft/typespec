// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal sealed class JsonLinesBinaryContentDefinition : TypeProvider
    {
        private sealed class JsonLinesBinaryContentTemplate<T> { }

        private readonly CSharpType _t;
        private readonly CSharpType _valuesType;
        private readonly FieldProvider _valuesField;
        private readonly FieldProvider _newLineField;
        private readonly FieldProvider _spaceField;
        private readonly ParameterProvider _streamParameter = new("stream", FormattableStringHelpers.Empty, typeof(Stream));

        public JsonLinesBinaryContentDefinition()
        {
            _t = typeof(JsonLinesBinaryContentTemplate<>).GetGenericArguments()[0];
            _valuesType = new CSharpType(typeof(IAsyncEnumerable<>), _t);
            _valuesField = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                _valuesType,
                "_values",
                this);
            _newLineField = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly,
                typeof(byte[]),
                "_newLine",
                this,
                initializationValue: New.Array(typeof(byte), false, false, [Literal(10)]));
            _spaceField = new FieldProvider(
                FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly,
                typeof(byte[]),
                "_space",
                this,
                initializationValue: New.Array(typeof(byte), false, false, [Literal(32)]));
        }

        protected override CSharpType[] GetTypeArguments() => [_t];

        protected override string BuildName() => "JsonLinesBinaryContent";

        protected override string BuildNamespace() => ScmCodeModelGenerator.Instance.TypeFactory.PrimaryNamespace;

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Sealed | TypeSignatureModifiers.Class;

        protected override string BuildRelativeFilePath()
            => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override CSharpType BuildBaseType()
            => ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType;

        protected override FieldProvider[] BuildFields() => [_valuesField, _newLineField, _spaceField];

        protected override ConstructorProvider[] BuildConstructors()
        {
            var values = new ParameterProvider("values", FormattableStringHelpers.Empty, _valuesType);
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, [values]),
                    new MethodBodyStatement[] { _valuesField.Assign(values).Terminate() },
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
            =>
            [
                BuildWriteToAsyncMethod(),
                BuildWriteJsonAsyncMethod(),
                BuildWriteToMethod(),
                BuildTryComputeLengthMethod(),
                BuildDisposeMethod(),
                BuildDeserializeModelMethod(),
                BuildDeserializeValueMethod()
            ];

        private MethodProvider BuildWriteToAsyncMethod()
        {
            var cancellationToken = KnownParameters.CancellationTokenParameter;
            var values = _valuesField.AsValueExpression.Invoke(
                "WithCancellation",
                [cancellationToken],
                null,
                false,
                false,
                typeof(TaskAsyncEnumerableExtensions));
            var loop = new ForEachStatement(_t, "value", values, true, out var value);
            ValueExpression stream = _streamParameter;
            var wireOptions = Static(ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition.Type)
                .Property(ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition.WireOptionsField.Name);
            var firstDeclaration = Declare("first", typeof(bool), True, out var first);
            loop.Add(new IfStatement(first.Equal(False))
            {
                stream.Invoke(
                    nameof(Stream.WriteAsync),
                    [_newLineField, Literal(0), Literal(1), cancellationToken],
                    null,
                    true).Terminate()
            });
            loop.Add(UsingDeclare(
                "buffer",
                typeof(MemoryStream),
                New.Instance<MemoryStream>(),
                out var buffer));
            loop.Add(UsingDeclare(
                "writer",
                typeof(Utf8JsonWriter),
                New.Instance<Utf8JsonWriter>(buffer),
                out var writer));
            loop.Add(writer.As<Utf8JsonWriter>().WriteObjectValue(value.As(_t), wireOptions));
            loop.Add(writer.As<Utf8JsonWriter>().FlushAsync(cancellationToken).Terminate());
            loop.Add(Declare("bytes", typeof(byte[]), buffer.As<MemoryStream>().ToArray(), out var bytes));
            loop.Add(Static(Type).Invoke(
                "WriteJsonAsync",
                [stream, bytes, cancellationToken],
                null,
                true).Terminate());
            loop.Add(first.Assign(False).Terminate());

            var signature = new MethodSignature(
                nameof(BinaryContent.WriteToAsync),
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Override | MethodSignatureModifiers.Async,
                typeof(Task),
                null,
                [_streamParameter, cancellationToken]);
            return new MethodProvider(signature, new MethodBodyStatement[] { firstDeclaration, loop }, this);
        }

        private MethodProvider BuildWriteJsonAsyncMethod()
        {
            var bytesParameter = new ParameterProvider("bytes", FormattableStringHelpers.Empty, typeof(byte[]));
            var cancellationToken = KnownParameters.CancellationTokenParameter;
            ValueExpression stream = _streamParameter;
            ValueExpression bytes = bytesParameter;
            var indexableBytes = new IndexableExpression(bytes);
            var inStringDeclaration = Declare("inString", typeof(bool), False, out var inString);
            var escapedDeclaration = Declare("escaped", typeof(bool), False, out var escaped);
            var startDeclaration = Declare("start", typeof(int), Literal(0), out var start);
            var indexDeclaration = Declare("i", typeof(int), Literal(0), out var index);
            var loop = new ForStatement(null, index.LessThan(bytes.Property("Length")), index.Increment());
            loop.Add(Declare("current", typeof(byte), indexableBytes[index], out var current));
            loop.Add(new IfElseStatement(
                new IfStatement(inString)
                {
                    new IfElseStatement(
                        new IfStatement(escaped)
                        {
                            escaped.Assign(False).Terminate()
                        },
                        new IfElseStatement(
                            new IfStatement(current.Equal(Literal('\\')))
                            {
                                escaped.Assign(True).Terminate()
                            },
                            new IfStatement(current.Equal(Literal('"')))
                            {
                                inString.Assign(False).Terminate()
                            }))
                },
                new IfElseStatement(
                    new IfStatement(current.Equal(Literal('"')))
                    {
                        inString.Assign(True).Terminate()
                    },
                    new IfStatement(current.Equal(Literal(':')))
                    {
                        stream.Invoke(
                            nameof(Stream.WriteAsync),
                            [
                                bytes,
                                start,
                                new BinaryOperatorExpression(
                                    "+",
                                    new BinaryOperatorExpression("-", index, start),
                                    Literal(1)),
                                cancellationToken
                            ],
                            null,
                            true).Terminate(),
                        stream.Invoke(
                            nameof(Stream.WriteAsync),
                            [_spaceField, Literal(0), Literal(1), cancellationToken],
                            null,
                            true).Terminate(),
                        start.Assign(new BinaryOperatorExpression("+", index, Literal(1))).Terminate()
                    })));

            var signature = new MethodSignature(
                "WriteJsonAsync",
                null,
                MethodSignatureModifiers.Private | MethodSignatureModifiers.Static | MethodSignatureModifiers.Async,
                typeof(Task),
                null,
                [_streamParameter, bytesParameter, cancellationToken]);
            return new MethodProvider(
                signature,
                new MethodBodyStatement[]
                {
                    inStringDeclaration,
                    escapedDeclaration,
                    startDeclaration,
                    indexDeclaration,
                    loop,
                    stream.Invoke(
                        nameof(Stream.WriteAsync),
                        [
                            bytes,
                            start,
                            new BinaryOperatorExpression("-", bytes.Property("Length"), start),
                            cancellationToken
                        ],
                        null,
                        true).Terminate()
                },
                this);
        }

        private MethodProvider BuildWriteToMethod()
        {
            var signature = new MethodSignature(
                nameof(BinaryContent.WriteTo),
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                null,
                null,
                [_streamParameter, KnownParameters.CancellationTokenParameter]);
            return new MethodProvider(
                signature,
                new MethodBodyStatement[] { Throw(New.NotSupportedException(Literal("JSON Lines content can only be written asynchronously."))) },
                this);
        }

        private MethodProvider BuildTryComputeLengthMethod()
        {
            var length = new ParameterProvider("length", FormattableStringHelpers.Empty, typeof(long), isOut: true);
            var signature = new MethodSignature(
                nameof(BinaryContent.TryComputeLength),
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                typeof(bool),
                null,
                [length]);
            return new MethodProvider(
                signature,
                new MethodBodyStatement[] { length.Assign(Literal(0)).Terminate(), Return(False) },
                this);
        }

        private MethodProvider BuildDisposeMethod()
        {
            var signature = new MethodSignature(
                nameof(IDisposable.Dispose),
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                null,
                null,
                []);
            return new MethodProvider(signature, Array.Empty<MethodBodyStatement>(), this);
        }

        private MethodProvider BuildDeserializeModelMethod()
        {
            var data = new ParameterProvider("data", FormattableStringHelpers.Empty, typeof(BinaryData));
            var wireOptions = Static(ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition.Type)
                .Property(ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition.WireOptionsField.Name);
            var signature = new MethodSignature(
                "DeserializeModel",
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                _t,
                null,
                [data]);
            return new MethodProvider(
                signature,
                new MethodBodyStatement[]
                {
                    Return(Static(typeof(ModelReaderWriter)).Invoke(
                        nameof(ModelReaderWriter.Read),
                        [data, wireOptions],
                        [_t]))
                },
                this);
        }

        private MethodProvider BuildDeserializeValueMethod()
        {
            var data = new ParameterProvider("data", FormattableStringHelpers.Empty, typeof(BinaryData));
            var signature = new MethodSignature(
                "DeserializeValue",
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                _t,
                null,
                [data]);
            return new MethodProvider(
                signature,
                new MethodBodyStatement[]
                {
                    Return(data.As<BinaryData>().ToObjectFromJson(_t))
                },
                this);
        }
    }
}
