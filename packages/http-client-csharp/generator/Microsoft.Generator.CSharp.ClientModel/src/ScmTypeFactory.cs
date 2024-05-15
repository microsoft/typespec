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
            // Uncomment this when the enums are implemented: https://github.com/Azure/autorest.csharp/issues/4579
            //InputEnumType enumType => ClientModelPlugin.Instance.OutputLibrary.EnumMappings.TryGetValue(enumType, out var provider)
            //? provider.Type.WithNullable(inputType.IsNullable)
            //: throw new InvalidOperationException($"No {nameof(EnumType)} has been created for `{enumType.Name}` {nameof(InputEnumType)}."),
            // TODO -- this is temporary until we have support for enums
            InputEnumType enumType => CreateCSharpType(enumType.EnumValueType).WithNullable(enumType.IsNullable),
            InputModelType model => ClientModelPlugin.Instance.OutputLibrary.ModelMappings.TryGetValue(model, out var provider)
            ? provider.Type.WithNullable(inputType.IsNullable)
            : new CSharpType(typeof(object), model.IsNullable).WithNullable(inputType.IsNullable),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputTypeKind.BinaryData => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputTypeKind.Boolean => new CSharpType(typeof(bool), inputType.IsNullable),
                InputTypeKind.BytesBase64Url => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputTypeKind.Bytes => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputTypeKind.ContentType => new CSharpType(typeof(HttpContent), inputType.IsNullable),
                InputTypeKind.Date => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputTypeKind.DateTime => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputTypeKind.DateTimeISO8601 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputTypeKind.DateTimeRFC1123 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputTypeKind.DateTimeRFC3339 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputTypeKind.DateTimeRFC7231 => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputTypeKind.DateTimeUnix => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputTypeKind.Decimal => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputTypeKind.Decimal128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputTypeKind.DurationISO8601 => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputTypeKind.DurationSeconds => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputTypeKind.DurationSecondsFloat => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputTypeKind.DurationConstant => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputTypeKind.ETag => new CSharpType(typeof(EntityTagHeaderValue), inputType.IsNullable),
                InputTypeKind.Float32 => new CSharpType(typeof(float), inputType.IsNullable),
                InputTypeKind.Float64 => new CSharpType(typeof(double), inputType.IsNullable),
                InputTypeKind.Float128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputTypeKind.Guid => new CSharpType(typeof(Guid), inputType.IsNullable),
                InputTypeKind.SByte => new CSharpType(typeof(sbyte), inputType.IsNullable),
                InputTypeKind.Byte => new CSharpType(typeof(byte), inputType.IsNullable),
                InputTypeKind.Int32 => new CSharpType(typeof(int), inputType.IsNullable),
                InputTypeKind.Int64 => new CSharpType(typeof(long), inputType.IsNullable),
                InputTypeKind.SafeInt => new CSharpType(typeof(long), inputType.IsNullable),
                InputTypeKind.IPAddress => new CSharpType(typeof(IPAddress), inputType.IsNullable),
                InputTypeKind.RequestMethod => new CSharpType(typeof(HttpMethod), inputType.IsNullable),
                InputTypeKind.Stream => new CSharpType(typeof(Stream), inputType.IsNullable),
                InputTypeKind.String => new CSharpType(typeof(string), inputType.IsNullable),
                InputTypeKind.Time => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputTypeKind.Uri => new CSharpType(typeof(Uri), inputType.IsNullable),
                _ => new CSharpType(typeof(object), inputType.IsNullable),
            },
            InputGenericType genericType => new CSharpType(genericType.Type, CreateCSharpType(genericType.ArgumentType)).WithNullable(inputType.IsNullable),
            InputIntrinsicType { Kind: InputIntrinsicTypeKind.Unknown } => typeof(BinaryData),
            _ => throw new Exception("Unknown type")
        };

        public override Parameter CreateCSharpParam(InputParameter inputParameter)
        {
            return Parameter.FromInputParameter(inputParameter);
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
