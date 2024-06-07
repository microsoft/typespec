// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

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
            InputLiteralType literalType => CSharpType.FromLiteral(CreateCSharpType(literalType.ValueType), literalType.Value),
            InputUnionType unionType => CSharpType.FromUnion(unionType.VariantTypes.Select(CreateCSharpType).ToArray(), unionType.IsNullable),
            InputListType { IsEmbeddingsVector: true } listType => new CSharpType(typeof(ReadOnlyMemory<>), listType.IsNullable, CreateCSharpType(listType.ElementType)),
            InputListType listType => new CSharpType(typeof(IList<>), listType.IsNullable, CreateCSharpType(listType.ElementType)),
            InputDictionaryType dictionaryType => new CSharpType(typeof(IDictionary<,>), inputType.IsNullable, typeof(string), CreateCSharpType(dictionaryType.ValueType)),
            InputEnumType enumType => ClientModelPlugin.Instance.OutputLibrary.EnumMappings.TryGetValue(enumType, out var provider)
                ? provider.Type.WithNullable(inputType.IsNullable)
                : throw new InvalidOperationException($"No {nameof(EnumProvider)} has been created for `{enumType.Name}` {nameof(InputEnumType)}."),
            InputModelType model => ClientModelPlugin.Instance.OutputLibrary.ModelMappings.TryGetValue(model, out var provider)
                ? provider.Type.WithNullable(inputType.IsNullable)
                : new CSharpType(typeof(object), model.IsNullable).WithNullable(inputType.IsNullable),
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.Boolean => new CSharpType(typeof(bool), inputType.IsNullable),
                InputPrimitiveTypeKind.Bytes => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                InputPrimitiveTypeKind.ContentType => new CSharpType(typeof(string), inputType.IsNullable),
                InputPrimitiveTypeKind.PlainDate => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
                InputPrimitiveTypeKind.Decimal => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.Decimal128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.PlainTime => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
                InputPrimitiveTypeKind.Float32 => new CSharpType(typeof(float), inputType.IsNullable),
                InputPrimitiveTypeKind.Float64 => new CSharpType(typeof(double), inputType.IsNullable),
                InputPrimitiveTypeKind.Float128 => new CSharpType(typeof(decimal), inputType.IsNullable),
                InputPrimitiveTypeKind.Guid or InputPrimitiveTypeKind.Uuid => new CSharpType(typeof(Guid), inputType.IsNullable),
                InputPrimitiveTypeKind.Int8 => new CSharpType(typeof(sbyte), inputType.IsNullable),
                InputPrimitiveTypeKind.UInt8 => new CSharpType(typeof(byte), inputType.IsNullable),
                InputPrimitiveTypeKind.Int32 => new CSharpType(typeof(int), inputType.IsNullable),
                InputPrimitiveTypeKind.Int64 => new CSharpType(typeof(long), inputType.IsNullable),
                InputPrimitiveTypeKind.SafeInt => new CSharpType(typeof(long), inputType.IsNullable),
                InputPrimitiveTypeKind.Integer => new CSharpType(typeof(long), inputType.IsNullable), // in typespec, integer is the base type of int related types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Float => new CSharpType(typeof(double), inputType.IsNullable), // in typespec, float is the base type of float32 and float64, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.Numeric => new CSharpType(typeof(double), inputType.IsNullable), // in typespec, numeric is the base type of number types, see type relation: https://typespec.io/docs/language-basics/type-relations
                InputPrimitiveTypeKind.IPAddress => new CSharpType(typeof(IPAddress), inputType.IsNullable),
                InputPrimitiveTypeKind.Stream => new CSharpType(typeof(Stream), inputType.IsNullable),
                InputPrimitiveTypeKind.String => new CSharpType(typeof(string), inputType.IsNullable),
                InputPrimitiveTypeKind.Uri or InputPrimitiveTypeKind.Url => new CSharpType(typeof(Uri), inputType.IsNullable),
                InputPrimitiveTypeKind.Char => new CSharpType(typeof(char), inputType.IsNullable),
                InputPrimitiveTypeKind.Any => new CSharpType(typeof(BinaryData), inputType.IsNullable),
                _ => new CSharpType(typeof(object), inputType.IsNullable),
            },
            InputDateTimeType dateTimeType => new CSharpType(typeof(DateTimeOffset), inputType.IsNullable),
            InputDurationType durationType => new CSharpType(typeof(TimeSpan), inputType.IsNullable),
            _ => throw new Exception("Unknown type")
        };

        public override ParameterProvider CreateCSharpParam(InputParameter inputParameter)
        {
            return new ParameterProvider(inputParameter);
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
