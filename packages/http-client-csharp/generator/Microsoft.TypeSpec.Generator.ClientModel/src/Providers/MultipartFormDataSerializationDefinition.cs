// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

#pragma warning disable SCME0004 // MultiPartFormContent is evaluation-only.
namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class MultipartFormDataSerializationDefinition : TypeProvider
    {
        private readonly bool _isStruct;

        private const string ToMultipartFormContentMethodName = "ToMultipartFormContent";
        private const string ContentVariableName = "content";
        private readonly bool _hasJsonOrXmlUsage;

        private readonly InputModelType _inputModel;
        private readonly ModelProvider _model;

        public MultipartFormDataSerializationDefinition(InputModelType inputModel, ModelProvider modelProvider)
        {
            _inputModel = inputModel;
            _model = modelProvider;
            _isStruct = _model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct);
            _hasJsonOrXmlUsage = (_inputModel.Usage & (InputModelTypeUsage.Json | InputModelTypeUsage.Xml)) != 0;
        }

        protected override string BuildName() => _model.Name;

        protected override string BuildNamespace() => _model.Type.Namespace;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _model.DeclarationModifiers;

        protected override IReadOnlyList<MethodProvider> BuildMethodsForBackCompatibility(IEnumerable<MethodProvider> originalMethods)
            => [.. originalMethods];

        protected override string BuildRelativeFilePath()
        {
            return Path.Combine("src", "Generated", "Models", $"{Name}.Serialization.Multipart.cs");
        }

        protected override SuppressionStatement[] BuildDisabledFileWarnings()
            => [new SuppressionStatement(null, Literal(ScmModelProvider.FileBinaryContentDiagnosticId), ScmModelProvider.ScmEvaluationTypeSuppressionJustification)];

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (_hasJsonOrXmlUsage)
            {
                return [];
            }

            if (_model.Constructors.Any(c => c.Signature.Parameters.Count == 0))
            {
                return [];
            }

            return [BuildEmptyConstructor()];
        }

        protected override MethodProvider[] BuildMethods()
        {
            var signature = new MethodSignature(
                ToMultipartFormContentMethodName,
                FormattableStringHelpers.Empty,
                MethodSignatureModifiers.Internal,
                MultiPartFormContentSnippets.Type,
                null,
                []);

            var statements = new List<MethodBodyStatement>
            {
                Declare(ContentVariableName, MultiPartFormContentSnippets.New(), out var contentVar),
                MethodBodyStatement.EmptyLine
            };

            foreach (var prop in _model.CanonicalView.Properties)
            {
                if (prop.WireInfo is null)
                {
                    continue;
                }

                statements.Add(BuildAddPartStatement(contentVar, prop));
            }

            statements.AddRange(
                MethodBodyStatement.EmptyLine,
                Return(contentVar));

            return [new MethodProvider(signature, statements, this)];
        }

        private static MethodBodyStatement BuildAddPartStatement(ScopedApi<MultiPartFormContent> contentVar, PropertyProvider prop)
        {
            var wireInfo = prop.WireInfo!;
            var multipart = (wireInfo.SerializationOptions as ScmSerializationOptions)?.Multipart;
            var defaultContentType = multipart is { IsFilePart: false, DefaultContentTypes.Count: > 0 }
                ? multipart.DefaultContentTypes[0]
                : null;
            var isFilePart = multipart?.IsFilePart == true;
            var isListOrArray = prop.Type.IsList || prop.Type.IsArray;
            var explicitContentType = (multipart?.ContentType?.Type as InputLiteralType)?.Value as string;
            var contentType = isFilePart
                ? null
                : explicitContentType ?? (IsPrimitivePart(prop) ? null : defaultContentType);

            MethodBodyStatement addStatement = (isListOrArray, prop.Type.IsDictionary) switch
            {
                // RFC 7578 4.3: when the part opts into isMulti, the array is emitted as one part
                // per element with the same field name.
                (true, _) when multipart?.IsMulti == true
                    => BuildMultiPartForEach(contentVar, prop, wireInfo.SerializedName, contentType, isFilePart),
                // Non-multi lists/arrays, and dictionaries (which have no RFC-defined multipart form),
                // are emitted as a single part.
                (true, _) or (false, true)
                    => BuildSinglePartCollection(contentVar, prop, wireInfo.SerializedName, explicitContentType ?? defaultContentType),
                _ => BuildScalarAdd(contentVar, wireInfo.SerializedName, prop, prop.Type, contentType, isFilePart),
            };

            if (wireInfo.IsRequired && !wireInfo.IsNullable)
            {
                return addStatement;
            }

            var isDefinedCondition = prop.Type is { IsCollection: true, IsReadOnlyMemory: false }
                ? OptionalSnippets.IsCollectionDefined(prop)
                : OptionalSnippets.IsDefined(prop);

            return new IfStatement(isDefinedCondition) { addStatement };
        }

        private static ForEachStatement BuildMultiPartForEach(ScopedApi<MultiPartFormContent> contentVar, PropertyProvider prop, string serializedName, string? contentType, bool isFilePart)
        {
            var elementType = prop.Type.ElementType;
            return new ForEachStatement(elementType, "item", prop, false, out var item)
            {
                BuildScalarAdd(contentVar, serializedName, item, elementType, contentType, isFilePart)
            };
        }

        private static MethodBodyStatement BuildScalarAdd(ScopedApi<MultiPartFormContent> contentVar, string serializedName, ValueExpression value, CSharpType type, string? contentType, bool isFilePart)
        {
            value = value.NullableStructValue(type);

            if (type.IsEnum)
            {
                return contentVar.Add(serializedName, type.ToSerial(value), contentType);
            }
            if (!type.IsFrameworkType)
            {
                return contentVar.Add(serializedName, value, ModelReaderWriterContextSnippets.Default, ModelSerializationExtensionsSnippets.Wire, contentType, type.WithNullable(false));
            }

            // A file part customized to a Stream or BinaryData is added through the FileBinaryContent
            if (isFilePart && !ScmModelProvider.IsFileBinaryContentType(type))
            {
                return contentVar.Add(serializedName, FileBinaryContentSnippets.New(value), contentType);
            }

            if (type.FrameworkType == typeof(Stream))
            {
                var binaryData = BinaryDataSnippets.FromStream(value, false);
                return contentType is not null
                    ? contentVar.AddWithMediaType(serializedName, binaryData, contentType)
                    : contentVar.Add(serializedName, binaryData, contentType);
            }
            if (type.FrameworkType == typeof(BinaryData) && contentType is not null)
            {
                return contentVar.AddWithMediaType(serializedName, value, contentType);
            }
            return contentVar.Add(serializedName, value, contentType);
        }

        private static bool IsPrimitivePart(PropertyProvider prop)
        {
            var partType = prop.Type.IsCollection
                ? prop.Type.ElementType
                : prop.Type;

            return partType.IsEnum
               || (partType.IsFrameworkType
                   && partType.FrameworkType != typeof(BinaryData)
                   && partType.FrameworkType != typeof(byte[])
                   && partType.FrameworkType != typeof(byte)
                   && partType.FrameworkType != typeof(Stream));
        }

        private static MethodBodyStatement BuildSinglePartCollection(ScopedApi<MultiPartFormContent> contentVar, PropertyProvider prop, string serializedName, string? contentType)
        {
            var elementType = prop.Type.ElementType;
            var dataVarName = $"{serializedName.ToVariableName()}Data".ToVariableName();

            ValueExpression writeCall;
            if (elementType.IsFrameworkType)
            {
                writeCall = prop.Type.IsDictionary
                    ? MultipartFormDataHelperSnippets.FromDictionary(prop, contentType)
                    : MultipartFormDataHelperSnippets.FromEnumerable(prop, contentType);
            }
            else
            {
                // Model element collection: round-trip through ModelReaderWriter and tag the resulting BinaryData.
                writeCall = Static(typeof(ModelReaderWriter)).Invoke(
                    nameof(ModelReaderWriter.Write),
                    [((MemberExpression)prop).CastTo(prop.Type), ModelSerializationExtensionsSnippets.Wire, ModelReaderWriterContextSnippets.Default])
                    .As<BinaryData>()
                    .WithMediaType(Literal(contentType ?? "application/json"));
            }

            return new MethodBodyStatement[]
            {
                Declare(dataVarName, typeof(BinaryData), writeCall, out var dataVar),
                contentVar.Add(serializedName, dataVar)
            };
        }

        private ConstructorProvider BuildEmptyConstructor()
        {
            var accessibility = _isStruct ? MethodSignatureModifiers.Public : MethodSignatureModifiers.Internal;
            return new ConstructorProvider(
                signature: new ConstructorSignature(Type, $"Initializes a new instance of {Type:C} for deserialization.", accessibility, Array.Empty<ParameterProvider>()),
                bodyStatements: MethodBodyStatement.Empty,
                this);
        }
    }
}
#pragma warning restore SCME0004
