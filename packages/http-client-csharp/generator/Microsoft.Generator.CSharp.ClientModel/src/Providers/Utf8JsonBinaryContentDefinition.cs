// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class Utf8JsonBinaryContentDefinition : TypeProvider
    {
        private const string _jsonWriterName = "JsonWriter";

        private readonly FieldProvider _streamField;
        private readonly FieldProvider _contentField;
        private readonly PropertyProvider _writerProperty;

        private readonly ParameterProvider _streamParameter = new ParameterProvider("stream", FormattableStringHelpers.Empty, typeof(Stream));

        public Utf8JsonBinaryContentDefinition()
        {
            _streamField = new FieldProvider(
                modifiers: FieldModifiers.Private | FieldModifiers.ReadOnly,
                type: typeof(MemoryStream),
                name: "_stream",
                enclosingType: this);
            _contentField = new FieldProvider(
                modifiers: FieldModifiers.Private | FieldModifiers.ReadOnly,
                type: typeof(BinaryContent),
                name: "_content",
                enclosingType: this);
            _writerProperty = new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Public,
                type: typeof(Utf8JsonWriter),
                name: _jsonWriterName,
                body: new AutoPropertyBody(false),
                enclosingType: this);
        }

        protected override string BuildName() => "Utf8JsonBinaryContent";

        protected override TypeSignatureModifiers GetDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override CSharpType? GetBaseType() => typeof(BinaryContent);

        protected override FieldProvider[] BuildFields()
        {
            return [_streamField, _contentField];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return [_writerProperty];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var signature = new ConstructorSignature(
                Type: Type,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [],
                Description: null);

            var body = new MethodBodyStatement[]
            {
                _streamField.Assign(New.Instance(typeof(MemoryStream))).Terminate(),
                _contentField.Assign(BinaryContentSnippets.Create(_streamField)).Terminate(),
                _writerProperty.Assign(New.Instance(typeof(Utf8JsonWriter), _streamField)).Terminate()
            };
            return [new ConstructorProvider(signature, body, this)];
        }

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildWriteToAsyncMethod(),
                BuildWriteToMethod(),
                BuildTryComputeLengthMethod(),
                BuildDisposeMethod()
            ];
        }

        private static readonly string WriteToAsync = nameof(BinaryContent.WriteToAsync);
        private static readonly string WriteTo = nameof(BinaryContent.WriteTo);
        private static readonly string TryComputeLength = nameof(BinaryContent.TryComputeLength);
        private static readonly string Dispose = nameof(IDisposable.Dispose);

        private MethodProvider BuildWriteToAsyncMethod()
        {
            var signature = new MethodSignature(
                Name: WriteToAsync,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override | MethodSignatureModifiers.Async,
                ReturnType: typeof(Task),
                Parameters: [_streamParameter, KnownParameters.CancellationTokenParameter],
                Description: null,
                ReturnDescription: null);

            var body = new MethodBodyStatement[]
            {
                _writerProperty.As<Utf8JsonWriter>().FlushAsync().Terminate(),
                _contentField.Invoke(WriteToAsync, [_streamParameter, KnownParameters.CancellationTokenParameter], true, true).Terminate()
            };

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildWriteToMethod()
        {
            var signature = new MethodSignature(
                Name: WriteTo,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: null,
                Parameters: [_streamParameter, KnownParameters.CancellationTokenParameter],
                Description: null,
                ReturnDescription: null);

            var body = new MethodBodyStatement[]
            {
                _writerProperty.As<Utf8JsonWriter>().Flush(),
                _contentField.Invoke(WriteTo, [_streamParameter, KnownParameters.CancellationTokenParameter], false, false).Terminate()
            };

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildTryComputeLengthMethod()
        {
            var lengthParameter = new ParameterProvider("length", FormattableStringHelpers.Empty, typeof(long), isOut: true);
            var signature = new MethodSignature(
                Name: TryComputeLength,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                Parameters: [lengthParameter],
                ReturnType: typeof(bool),
                Description: null,
                ReturnDescription: null);

            var writer = _writerProperty.As<Utf8JsonWriter>();
            var body = new MethodBodyStatement[]
            {
                lengthParameter.Assign(writer.BytesCommitted().Add(writer.BytesPending())).Terminate(),
                Return(True)
            };

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildDisposeMethod()
        {
            var signature = new MethodSignature(
                Name: Dispose,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                Parameters: [],
                ReturnType: null,
                Description: null,
                ReturnDescription: null);

            var body = new MethodBodyStatement[]
            {
                InvokeDispose(_writerProperty),
                InvokeDispose(_contentField),
                InvokeDispose(_streamField)
            };
            return new MethodProvider(signature, body, this);

            static MethodBodyStatement InvokeDispose(ValueExpression instance)
                => instance.Invoke(nameof(IDisposable.Dispose)).Terminate();
        }
    }
}
