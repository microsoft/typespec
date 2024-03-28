// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Linq;
using System.Text.Json;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal static partial class Snippets
    {
        public static class InvokeOptional
        {
            public static BoolExpression IsCollectionDefined(TypedValueExpression collection)
            {
                return OptionalTypeProvider.Instance.IsCollectionDefined(collection);
            }

            public static ValueExpression FallBackToChangeTrackingCollection(TypedValueExpression collection, CSharpType? paramType)
            {
                if (!TypeFactory.IsCollectionType(collection.Type) || TypeFactory.IsReadOnlyMemory(collection.Type))
                {
                    return collection;
                }

                var changeTrackingType = collection.Type.Arguments.Count == 1
                    ? ChangeTrackingListProvider.Instance.Type.MakeGenericType(collection.Type.Arguments)
                    : new CSharpType(Configuration.ApiTypes.ChangeTrackingDictionaryType, collection.Type.Arguments);
                return NullCoalescing(collection, New.Instance(changeTrackingType));
            }

            public static MethodBodyStatement WrapInIsDefined(PropertySerialization serialization, MethodBodyStatement statement, bool isBicep = false)
            {
                //bicep shares its serialization types with JsonSerialization so we need the additional bool to know if we are serializing bicep.
                //if we are serializing bicep, we don't need to check if the property is required
                if (!isBicep && serialization.IsRequired)
                {
                    return statement;
                }

                if (!serialization.Value.Type.IsNullable && serialization.Value.Type.IsValueType)
                {
                    if (!serialization.Value.Type.Equals(typeof(JsonElement)))
                    {
                        return statement;
                    }
                }

                return TypeFactory.IsCollectionType(serialization.Value.Type) && !TypeFactory.IsReadOnlyMemory(serialization.Value.Type)
                    ? new IfStatement(IsCollectionDefined(serialization.Value)) { statement }
                    : new IfStatement(OptionalTypeProvider.Instance.IsDefined(serialization.Value)) { statement };
            }

            public static MethodBodyStatement WrapInIsNotEmpty(PropertySerialization serialization, MethodBodyStatement statement)
            {
                return TypeFactory.IsCollectionType(serialization.Value.Type) && !TypeFactory.IsReadOnlyMemory(serialization.Value.Type)
                    ? new IfStatement(new BoolExpression(InvokeStaticMethodExpression.Extension(typeof(Enumerable), nameof(Enumerable.Any), serialization.Value))) { statement }
                    : statement;
            }
        }
    }
}
