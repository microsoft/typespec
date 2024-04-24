// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using System.Net.Http;
using System.Net.Http.Headers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal class GeneratorCSharpTypeFactory : TypeFactory
    {
        /// <summary>
        /// This method will attempt to retrieve the <see cref="CSharpType"/> of the input type.
        /// </summary>
        /// <param name="inputType">The input type to convert.</param>
        /// <returns>The <see cref="CSharpType"/> of the input type.</returns>
        public override CSharpType CreateType(InputType inputType) => inputType switch
        {
            InputLiteralType literalType => CSharpType.FromLiteral(CreateType(literalType.LiteralValueType), literalType.Value),
            InputUnionType unionType => CSharpType.FromUnion(unionType.UnionItemTypes.Select(CreateType).ToArray(), unionType.IsNullable),
            InputList { IsEmbeddingsVector: true } listType => new CSharpType(typeof(ReadOnlyMemory<>), listType.IsNullable, CreateType(listType.ElementType)),
            InputList listType => new CSharpType(typeof(IList<>), listType.IsNullable, CreateType(listType.ElementType)),
            InputDictionary dictionaryType => new CSharpType(typeof(IDictionary<,>), inputType.IsNullable, typeof(string), CreateType(dictionaryType.ValueType)),
            // Uncomment this when the enums are implemented: https://github.com/Azure/autorest.csharp/issues/4579
            //InputEnumType enumType => ClientModelPlugin.Instance.OutputLibrary.EnumMappings.TryGetValue(enumType, out var provider)
            //? provider.Type.WithNullable(inputType.IsNullable)
            //: throw new InvalidOperationException($"No {nameof(EnumType)} has been created for `{enumType.Name}` {nameof(InputEnumType)}."),
            InputEnumType enumType => new CSharpType(typeof(string), inputType.IsNullable),
            InputModelType model => ClientModelPlugin.Instance.OutputLibrary.ModelMappings.TryGetValue(model, out var provider)
            ? provider.Type.WithNullable(inputType.IsNullable)
            : new CSharpType(typeof(object), model.IsNullable).WithNullable(inputType.IsNullable),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputTypeKind.BinaryData => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputTypeKind.Boolean => new CSharpType(typeof(bool), inputType.IsNullable),
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
            InputGenericType genericType => new CSharpType(genericType.Type, CreateType(genericType.ArgumentType)).WithNullable(inputType.IsNullable),
            InputIntrinsicType { Kind: InputIntrinsicTypeKind.Unknown } => typeof(BinaryData),
            _ => throw new Exception("Unknown type")
        };

        public override Method CreateMethod(InputOperation operation, bool returnProtocol = true)
        {
            var methodType = GetMethodType(operation);
            switch (methodType)
            {
                case "default":
                    return new Method
                    (
                        new MethodSignature(operation.Name, $"{operation?.Summary}", null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()),
                        Array.Empty<MethodBodyStatement>(),
                        methodType
                    );
                case "longRunning":
                    return new Method
                    (
                        CreateLongRunningMethodSignature(operation),
                        Array.Empty<MethodBodyStatement>(),
                        methodType
                    );
                default:
                    throw new Exception($"Unknown method type {methodType}");
            }
        }

        private static string GetMethodType(InputOperation operation)
        {
            var defaultMethodType = "default";

            if (operation.LongRunning is not null)
                return "longRunning";
            if (operation.Paging is not null)
                return "paging";
            return defaultMethodType;
        }

        private MethodSignature CreateLongRunningMethodSignature(InputOperation operation)
        {
            var methodName = operation.Name + "Async";
            var returnType = new CSharpType(typeof(Task<>), GetReturnType(operation).Arguments, false);
            var parameters = operation.Parameters.Select(p => new Parameter(p.Name, $"{p.Description}", CreateType(p.Type), DefaultValue: null, ValidationType.None, Initializer: null)).ToList();
            return new MethodSignature(methodName, $"{operation?.Summary}", null, MethodSignatureModifiers.Public, returnType, null, parameters);
        }

        private CSharpType GetReturnType(InputOperation operation)
        {
            CSharpType? responseType = null;
            var firstResponse = operation.Responses.FirstOrDefault();
            if (firstResponse != null)
            {
                var bodyType = firstResponse.BodyType;
                if (bodyType != null)
                {
                    responseType = CreateType(bodyType);
                }
            }

            if (responseType is null)
            {
                responseType = new CSharpType(typeof(void), false);
            }

            return responseType;
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
