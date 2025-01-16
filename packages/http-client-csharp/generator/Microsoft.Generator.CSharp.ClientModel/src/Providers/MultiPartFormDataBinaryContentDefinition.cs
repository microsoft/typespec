// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
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
    internal class MultiPartFormDataBinaryContentDefinition : TypeProvider
    {
        private class FormDataItemTemplate<T> { }
        private readonly ScopedApi<MultipartFormDataContent> _multipartContentExpression;
        private readonly FieldProvider _multipartContentField;
        private readonly FieldProvider _randomField;
        private readonly FieldProvider _boundaryValuesFields;

        private readonly PropertyProvider _contentTypeProperty;
        private const string _contentTypePropertyName = "ContentType";
        private readonly PropertyProvider _httpContentProperty;
        private const string _httpContentPropertyName = "HttpContent";
        private const string _createBoundaryMethodName = "CreateBoundary";
        private const string _addMethodName = "Add";
        private const string _addFilenameHeaderMethodName = "AddFilenameHeader";
        private const string _addContentTypeHeaderMethodName = "AddContentTypeHeader";
        private const string _writeToMethodName = "WriteTo";
        private const string _writeToAsyncMethodName = "WriteToAsync";

        public MultiPartFormDataBinaryContentDefinition()
        {
            _multipartContentField = new FieldProvider(
                modifiers: FieldModifiers.Private | FieldModifiers.ReadOnly,
                type: typeof(MultipartFormDataContent),
                name: "_multipartContent",
                enclosingType: this);
            _multipartContentExpression = _multipartContentField.As<MultipartFormDataContent>();
            _randomField = new FieldProvider(
                modifiers: FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly,
                type: typeof(Random),
                name: "_random",
                initializationValue: New.Instance(typeof(Random), []),
                enclosingType: this);
            _boundaryValuesFields = new FieldProvider(
                modifiers: FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly,
                type: typeof(char[]),
                name: "_boundaryValues",
                initializationValue: Literal("0123456789=ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz").ToCharArray(),
                enclosingType: this);
            _contentTypeProperty = new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Public,
                type: typeof(string),
                name: _contentTypePropertyName,
                body: new MethodPropertyBody(Return(_multipartContentExpression.Headers().ContentType().InvokeToString())),
                enclosingType: this);
            _httpContentProperty = new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Internal,
                type: typeof(HttpContent),
                name: _httpContentPropertyName,
                body: new ExpressionPropertyBody(_multipartContentField),
                enclosingType: this);
        }

        protected override string BuildName() => "MultiPartFormDataBinaryContent";

        protected override TypeSignatureModifiers GetDeclarationModifiers() => TypeSignatureModifiers.Class | TypeSignatureModifiers.Internal;

        protected override CSharpType? GetBaseType() => typeof(BinaryContent);

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override FieldProvider[] BuildFields()
        {
            return [_multipartContentField, _randomField, _boundaryValuesFields];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return [_contentTypeProperty, _httpContentProperty];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var signature = new ConstructorSignature(
                Type: Type,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [],
                Description: null);

            return
            [
                new ConstructorProvider(signature, new MethodBodyStatements(
                [
                    _multipartContentField.Assign(New.Instance<MultipartFormDataContent>([CreateBoundary()])).Terminate()
                ]),
                this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildCreateBoundaryMethod(),
                .. BuildAddMethods(),
                BuildAddContentTypeHeaderMethod(),
                BuildTryComputeLengthMethod(),
                BuildWriteToMethod(),
                BuildWriteToAsyncMethod(),
                BuildDisposeMethod(),
            ];
        }

        private MethodProvider BuildCreateBoundaryMethod()
        {
            var signature = new MethodSignature(
                Name: _createBoundaryMethodName,
                Description: null,
                Modifiers: MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                ReturnType: typeof(string),
                ReturnDescription: null,
                Parameters: []);
            var body = new MethodBodyStatement[]
            {
                Declare("chars", typeof(Span<char>), New.Array(typeof(char), Literal(70)), out var chars),
                Declare("random", typeof(byte[]), New.Array(typeof(byte), Literal(70)), out var random),
                _randomField.Invoke(nameof(Random.NextBytes), [random]).Terminate(),
                Declare("mask", typeof(int), new BinaryOperatorExpression(">>", Literal(255), Literal(2)), out var mask),
                Declare("i", Literal(0), out var i),
                new ForStatement(
                    null,
                    i.LessThan(Literal(70)),
                    i.Increment())
                {
                    new IndexerExpression(chars, i).Assign(new IndexerExpression(_boundaryValuesFields, new BinaryOperatorExpression("&", new IndexerExpression(random, i), mask))).Terminate(),
                },
                Return(chars.InvokeToString())
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider[] BuildAddMethods()
        {
            return
            [
                BuildAddMethod<string>(),
                BuildAddMethod<int>(),
                BuildAddMethod<long>(),
                BuildAddMethod<float>(),
                BuildAddMethod<double>(),
                BuildAddMethod<decimal>(),
                BuildAddMethod<bool>(),
                BuildAddMethod<Stream>(),
                BuildAddMethod<byte[]>(),
                BuildAddMethod<BinaryData>(),
                BuildAddHttpContentMethod()
            ];
        }

        private MethodProvider BuildAddMethod<T>()
        {
            var contentParam = new ParameterProvider("content", FormattableStringHelpers.Empty, typeof(T));
            var nameParam = new ParameterProvider("name", FormattableStringHelpers.Empty, typeof(string));
            var filenameParam = new ParameterProvider("filename", FormattableStringHelpers.Empty, new CSharpType(typeof(string), true), Default);
            var contentTypeParam = new ParameterProvider("contentType", FormattableStringHelpers.Empty, new CSharpType(typeof(string), true), Default);
            var signature = new MethodSignature(
                Name: _addMethodName,
                Description: null,
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                ReturnDescription: null,
                Parameters:
                [
                    contentParam,
                    nameParam,
                    filenameParam,
                    contentTypeParam
                ]);
            MethodBodyStatement? valueDelareStatement = null;
            ValueExpression contentExpression = New.Instance<ByteArrayContent>(contentParam);
            Type contentParamType = typeof(T);
            if (contentParamType == typeof(Stream))
            {
                contentExpression = New.Instance<StreamContent>(contentParam);
            }
            else if (contentParamType == typeof(string))
            {
                contentExpression = New.Instance<StringContent>(contentParam);
            }
            else if (contentParamType == typeof(bool))
            {
                var boolToStringValue = new TernaryConditionalExpression(contentParam, Literal("true"), Literal("false")).As<string>();
                valueDelareStatement = Declare("value", boolToStringValue, out var boolVariable);
                contentExpression = New.Instance<StringContent>(boolVariable);
            }
            else if (contentParamType == typeof(int)
                || contentParamType == typeof(float)
                || contentParamType == typeof(long)
                || contentParamType == typeof(double)
                || contentParamType == typeof(decimal))
            {
                ValueExpression invariantCulture = Static<CultureInfo>().Property(nameof(CultureInfo.InvariantCulture));
                var invariantCultureValue = contentParam.Invoke(nameof(Int32.ToString), [Literal("G"), invariantCulture]).As<string>();
                valueDelareStatement = Declare("value", invariantCultureValue, out var variable);
                contentExpression = New.Instance<StringContent>(variable);
            }
            else if (contentParamType == typeof(BinaryData))
            {
                contentExpression = New.Instance<ByteArrayContent>(contentParam.As<BinaryData>().ToArray());
            }
            else if (contentParamType == typeof(byte[]))
            {
                contentExpression = New.Instance<ByteArrayContent>(contentParam);
            }
            else
            {
                throw new NotSupportedException($"{contentParamType} is not supported");
            }
            List<MethodBodyStatement> addContentStatements = new List<MethodBodyStatement>();
            if (valueDelareStatement != null)
            {
                addContentStatements.Add(valueDelareStatement);
            }
            addContentStatements.Add(This.Invoke(_addMethodName, [contentExpression, nameParam, filenameParam, contentTypeParam]).Terminate());
            var body = new MethodBodyStatement[]
            {
                ArgumentSnippets.AssertNotNull(contentParam),
                ArgumentSnippets.AssertNotNullOrEmpty(nameParam),
                MethodBodyStatement.EmptyLine,
                addContentStatements.ToArray(),
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildAddHttpContentMethod()
        {
            var contentParam = new ParameterProvider("content", FormattableStringHelpers.Empty, typeof(HttpContent));
            var nameParam = new ParameterProvider("name", FormattableStringHelpers.Empty, typeof(string));
            var filenameParam = new ParameterProvider("filename", FormattableStringHelpers.Empty, new CSharpType(typeof(string), true));
            var contentTypeParam = new ParameterProvider("contentType", FormattableStringHelpers.Empty, new CSharpType(typeof(string), true));
            var signature = new MethodSignature(
                Name: "Add",
                Description: null,
                Modifiers: MethodSignatureModifiers.Private,
                ReturnType: null,
                ReturnDescription: null,
                Parameters:
                [
                    contentParam,
                    nameParam,
                    filenameParam,
                    contentTypeParam,
                ]);
            var body = new MethodBodyStatement[]
            {
                new IfStatement(contentTypeParam.NotEqual(Null))
                {
                    ArgumentSnippets.AssertNotNullOrEmpty(contentTypeParam),
                    AddContentTypeHeader(contentParam, contentTypeParam),
                },
                new IfElseStatement(filenameParam.NotEqual(Null),
                new MethodBodyStatements(
                [
                    ArgumentSnippets.AssertNotNullOrEmpty(filenameParam),
                    _multipartContentExpression.Add(contentParam, nameParam, filenameParam).Terminate()
                ]),
                new MethodBodyStatements(
                [
                    _multipartContentExpression.Add(contentParam, nameParam).Terminate()
                ])),
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildAddContentTypeHeaderMethod()
        {
            var contentParam = new ParameterProvider("content", FormattableStringHelpers.Empty, typeof(HttpContent));
            var contentTypeParam = new ParameterProvider("contentType", FormattableStringHelpers.Empty, typeof(string));
            var signature = new MethodSignature(
                Name: _addContentTypeHeaderMethodName,
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                ReturnType: null,
                ReturnDescription: null,
                Parameters:
                [
                    contentParam,
                    contentTypeParam,
                ]);
            var contentTypeExpression = (ValueExpression)contentTypeParam;
            ValueExpression contentTypeHeaderExpression = contentParam.As<HttpContent>().Headers().ContentType();
            var body = new MethodBodyStatement[]
            {
                Declare("header", New.Instance<MediaTypeHeaderValue>([contentTypeExpression]), out var header),
                contentTypeHeaderExpression.Assign(header).Terminate(),
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildTryComputeLengthMethod()
        {
            var lengthParameter = new ParameterProvider("length", FormattableStringHelpers.Empty, typeof(long), isOut: true);
            var signature = new MethodSignature(
                Name: "TryComputeLength",
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: typeof(bool),
                ReturnDescription: null,
                Parameters:
                [
                    lengthParameter,
                ]);
            ValueExpression contentLengthHeaderExpression = _multipartContentExpression.Headers().ContentLength();
            var body = new MethodBodyStatement[]
            {
                new IfStatement(contentLengthHeaderExpression.Is(Declare<long>("contentLength", out var contentLengthVariable)))
                {
                    lengthParameter.Assign(contentLengthVariable).Terminate(),
                    Return(Literal(true)),
                },
                lengthParameter.Assign(Literal(0)).Terminate(),
                Return(Literal(false)),
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildWriteToMethod()
        {
            var streamParam = new ParameterProvider("stream", FormattableStringHelpers.Empty, typeof(Stream));
            var streamExpression = (ValueExpression)streamParam;
            var cancellationTokenParam = KnownParameters.CancellationTokenParameter;
            var cancellatinTokenExpression = (ValueExpression)cancellationTokenParam;
            var signature = new MethodSignature(
                Name: "WriteTo",
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: null,
                ReturnDescription: null,
                Parameters:
                [
                    streamParam,
                    cancellationTokenParam
                ]);
            var taskWaitCompletedStatementsList = new List<MethodBodyStatement>();
            ValueExpression getTaskWaiterExpression = _multipartContentExpression.CopyToAsync(streamParam, isAsync: false).Invoke(nameof(Task.GetAwaiter), []);
            /*_multipartContent.CopyToAsync(stream).GetAwaiter().GetResult();*/
            taskWaitCompletedStatementsList.Add(getTaskWaiterExpression.Invoke(nameof(TaskAwaiter.GetResult), []).Terminate());
            var body = new MethodBodyStatement[]
            {
                new IfElsePreprocessorStatement(
                    "NET6_0_OR_GREATER",
                    /*_multipartContent.CopyTo(stream, cancellationToken);*/
                    _multipartContentExpression.CopyTo(streamExpression, cancellatinTokenExpression).Terminate(),
                    taskWaitCompletedStatementsList.ToArray()),
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildWriteToAsyncMethod()
        {
            var streamParam = new ParameterProvider("stream", FormattableStringHelpers.Empty, typeof(Stream));
            var streamExpression = (ValueExpression)streamParam;
            var cancellationTokenParam = KnownParameters.CancellationTokenParameter;
            var cancellatinTokenExpression = (ValueExpression)cancellationTokenParam;

            var signature = new MethodSignature(
                Name: "WriteToAsync",
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override | MethodSignatureModifiers.Async,
                ReturnType: typeof(Task),
                ReturnDescription: null,
                Parameters:
                [
                    streamParam,
                    cancellationTokenParam
                ]);
            var body = new MethodBodyStatement[]
            {
                new IfElsePreprocessorStatement(
                    "NET6_0_OR_GREATER",
                    /*await _multipartContent.CopyToAsync(stream, cancellationToken).ConfigureAwait(false);,*/
                    _multipartContentExpression.CopyToAsync(streamExpression, cancellatinTokenExpression).Terminate(),
                    /*await _multipartContent.CopyToAsync(stream).ConfigureAwait(false);*/
                    _multipartContentExpression.CopyToAsync(streamExpression).Terminate()),
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildDisposeMethod()
        {
            var signature = new MethodSignature(
                Name: "Dispose",
                Description: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                ReturnType: null,
                ReturnDescription: null,
                Parameters: []);
            var body = new MethodBodyStatement[]
            {
                _multipartContentField.Invoke(nameof(MultipartFormDataContent.Dispose), []).Terminate()
            };
            return new MethodProvider(signature, body, this);
        }

        public ValueExpression CreateBoundary()
            => Static(Type).Invoke(_createBoundaryMethodName, []);

        public MethodBodyStatement AddFilenameHeader(ValueExpression httpContent, ValueExpression name, ValueExpression filename)
            => This.Invoke(_addFilenameHeaderMethodName, [httpContent, name, filename]).Terminate();

        public MethodBodyStatement AddContentTypeHeader(ValueExpression httpContent, ValueExpression contentType)
            => Static(Type).Invoke(_addContentTypeHeaderMethodName, [httpContent, contentType]).Terminate();
    }
}
