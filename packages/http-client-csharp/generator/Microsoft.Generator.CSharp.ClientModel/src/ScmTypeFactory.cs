// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Microsoft.Generator.CSharp.Input;
using System.Net.Http;
using System.Net.Http.Headers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal class ScmTypeFactory : TypeFactory
    {
        /// <summary>
        /// This method will attempt to retrieve the <see cref="CSharpType"/> of the input type.
        /// </summary>
        /// <param name="inputType">The input type to convert.</param>
        /// <returns>The <see cref="CSharpType"/> of the input type.</returns>
        public override CSharpType CreateCSharpType(InputType inputType) => inputType switch
        {
            InputLiteralType literalType => CSharpType.FromLiteral(CreateCSharpType(literalType.LiteralValueType), literalType.Value),
            InputUnionType unionType => CSharpType.FromUnion(unionType.UnionItemTypes.Select(CreateCSharpType).ToArray(), unionType.IsNullable),
            InputList { IsEmbeddingsVector: true } listType => new CSharpType(typeof(ReadOnlyMemory<>), listType.IsNullable, CreateCSharpType(listType.ElementType)),
            InputList listType => new CSharpType(typeof(IList<>), listType.IsNullable, CreateCSharpType(listType.ElementType)),
            InputDictionary dictionaryType => new CSharpType(typeof(IDictionary<,>), inputType.IsNullable, typeof(string), CreateCSharpType(dictionaryType.ValueType)),
            InputEnumType enumType => ClientModelPlugin.Instance.OutputLibrary.EnumMappings.TryGetValue(enumType, out var provider)
                ? provider.Type.WithNullable(inputType.IsNullable)
                : throw new InvalidOperationException($"No {nameof(EnumProvider)} has been created for `{enumType.Name}` {nameof(InputEnumType)}."),
            InputModelType model => ClientModelPlugin.Instance.OutputLibrary.ModelMappings.TryGetValue(model, out var provider)
                ? provider.Type.WithNullable(inputType.IsNullable)
                : new CSharpType(typeof(object), model.IsNullable).WithNullable(inputType.IsNullable),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.BinaryData => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputPrimitiveTypeKind.Boolean => new CSharpType(typeof(bool), inputType.IsNullable),
                InputPrimitiveTypeKind.BytesBase64Url => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputPrimitiveTypeKind.Bytes => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputPrimitiveTypeKind.ContentType => new CSharpType(typeof(HttpContent), inputType.IsNullable),
                InputPrimitiveTypeKind.Date => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.DateTime => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.DateTimeISO8601 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.DateTimeRFC1123 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.DateTimeRFC3339 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.DateTimeRFC7231 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.DateTimeUnix => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.Decimal => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.Decimal128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.DurationISO8601 => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputPrimitiveTypeKind.DurationSeconds => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputPrimitiveTypeKind.DurationSecondsFloat => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputPrimitiveTypeKind.DurationConstant => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputPrimitiveTypeKind.ETag => new CSharpType(typeof(EntityTagHeaderValue), inputType.IsNullable),
                InputPrimitiveTypeKind.Float32 => new CSharpType(typeof(float), inputType.IsNullable),
                InputPrimitiveTypeKind.Float64 => new CSharpType(typeof(double), inputType.IsNullable),
                InputPrimitiveTypeKind.Float128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.Guid => new CSharpType(typeof(Guid), inputType.IsNullable),
                InputPrimitiveTypeKind.SByte => new CSharpType(typeof(sbyte), inputType.IsNullable),
                InputPrimitiveTypeKind.Byte => new CSharpType(typeof(byte), inputType.IsNullable),
                InputPrimitiveTypeKind.Int32 => new CSharpType(typeof(int), inputType.IsNullable),
                InputPrimitiveTypeKind.Int64 => new CSharpType(typeof(long), inputType.IsNullable),
                InputPrimitiveTypeKind.SafeInt => new CSharpType(typeof(long), inputType.IsNullable),
                InputPrimitiveTypeKind.IPAddress => new CSharpType(typeof(IPAddress), inputType.IsNullable),
                InputPrimitiveTypeKind.RequestMethod => new CSharpType(typeof(HttpMethod), inputType.IsNullable),
                InputPrimitiveTypeKind.Stream => new CSharpType(typeof(Stream), inputType.IsNullable),
                InputPrimitiveTypeKind.String => new CSharpType(typeof(string), inputType.IsNullable),
                InputPrimitiveTypeKind.Time => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputPrimitiveTypeKind.Uri => new CSharpType(typeof(Uri), inputType.IsNullable),
                _ => new CSharpType(typeof(object), inputType.IsNullable),
            },
            InputGenericType genericType => new CSharpType(genericType.Type, genericType.Arguments.Select(CreateCSharpType).ToArray(), genericType.IsNullable),
            InputIntrinsicType { Kind: InputIntrinsicTypeKind.Unknown } => typeof(BinaryData),
            _ => throw new Exception("Unknown type")
        };

        public override Parameter CreateCSharpParam(InputParameter inputParameter)
        {
            return new Parameter(inputParameter);
        }

        /// <summary>
        /// Creates a <see cref="CSharpMethodCollection"/> for the given operation. If the operation is a <see cref="OperationKinds.DefaultValue"/> operation,
        /// a method collection will be created consisting of a <see cref="CSharpMethodKinds.CreateMessage"/> method. Otherwise, <c>null</c> will be returned.
        /// </summary>
        /// <param name="operation">The input operation to create methods for.</param>
        public override CSharpMethodCollection? CreateCSharpMethodCollection(InputOperation operation)
        {
            switch (GetOperationKind(operation))
            {
                case var value when value == OperationKinds.Default:
                    return CSharpMethodCollection.DefaultCSharpMethodCollection(operation);
                default:
                    return null;
            }
        }

        /// <summary>
        /// Returns the <see cref="OperationKinds"/> of the given operation.
        /// By default, the operation kind is <see cref="OperationKinds.Default"/>.
        /// </summary>
        private static OperationKinds GetOperationKind(InputOperation operation)
        {
            return operation switch
            {
                { LongRunning: { } } => OperationKinds.LongRunning,
                { Paging: { } } => OperationKinds.Paging,
                _ => OperationKinds.Default,
            };
        }

        public override CSharpType MatchConditionsType()
        {
            // TO-DO: Determine what the correct type is for MatchConditions: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }

        public override CSharpType RequestConditionsType()
        {
            // TO-DO: Determine what the correct type is for RequestConditions: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }

        public override CSharpType TokenCredentialType()
        {
            // TO-DO: Determine what the correct type is for TokenCredential: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }

        public override CSharpType PageResponseType()
        {
            // TO-DO: Determine what the correct type is for Page: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }
    }
}
