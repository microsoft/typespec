// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
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

        protected override FieldProvider[] BuildFields() => [_valuesField, _newLineField];

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
                BuildWriteToMethod(),
                BuildTryComputeLengthMethod(),
                BuildDisposeMethod()
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
            loop.Add(new IfStatement(Not(first))
            {
                stream.Invoke(
                    nameof(Stream.WriteAsync),
                    [_newLineField, Literal(0), Literal(1), cancellationToken],
                    null,
                    true).Terminate()
            });
            var writerScope = new UsingScopeStatement(
                typeof(Utf8JsonWriter),
                "writer",
                New.Instance<Utf8JsonWriter>(stream),
                out var writer);
            writerScope.AddRange(
            [
                writer.As<Utf8JsonWriter>().WriteObjectValue(value.As(_t), wireOptions),
                writer.As<Utf8JsonWriter>().FlushAsync(cancellationToken).Terminate()
            ]);
            loop.Add(writerScope);
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
    }
}
