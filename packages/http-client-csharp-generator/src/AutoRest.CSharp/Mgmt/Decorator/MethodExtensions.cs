// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    internal static class MethodExtensions
    {
        /// <summary>
        /// Return true if this operation is a list method. Also returns the itemType of what this operation is listing of, and the property name on the list result model.
        /// This function will return true in the following circumstances:
        /// 1. This operation is a paging method, in this case, valuePropertyName is the same as configured in the pageable options (x-ms-pageable)
        /// 2. This operation is not a paging method, but the return value is a collection type (IReadOnlyList), in this case, valuePropertyName is the empty string
        /// 3. This operation is not a paging method and the return value is not a collection type, but it has similar structure as paging method (has a value property, and value property is a collection)
        /// </summary>
        /// <param name="method"></param>
        /// <param name="itemType"></param>
        /// <param name="valuePropertyName"></param>
        /// <returns></returns>
        internal static bool IsListMethod(this RestClientMethod method, [MaybeNullWhen(false)] out CSharpType itemType, [MaybeNullWhen(false)] out string valuePropertyName)
        {
            itemType = null;
            valuePropertyName = null;
            var returnType = method.ReturnType;
            if (returnType == null)
                return false;
            if (returnType.IsFrameworkType || returnType.Implementation is not SchemaObjectType)
            {
                if (TypeFactory.IsList(returnType))
                {
                    itemType = returnType.Arguments[0];
                    valuePropertyName = string.Empty;
                    return true;
                }
            }
            else
            {
                valuePropertyName = method.Operation.Paging?.ItemName ?? "value";
                var schemaObject = (SchemaObjectType)returnType.Implementation;
                itemType = GetValueProperty(schemaObject, valuePropertyName)?.ValueType.Arguments.FirstOrDefault();
            }
            return itemType != null;
        }

        /// <summary>
        /// Return true if this operation is a list method. Also returns the itemType of what this operation is listing of.
        /// This function will return true in the following circumstances:
        /// 1. This operation is a paging method.
        /// 2. This operation is not a paging method, but the return value is a collection type (IReadOnlyList)
        /// 3. This operation is not a paging method and the return value is not a collection type, but it has similar structure as paging method (has a value property, and value property is a collection)
        /// </summary>
        /// <param name="method"></param>
        /// <param name="itemType">The type of the item in the collection</param>
        /// <returns></returns>
        public static bool IsListMethod(this RestClientMethod method, [MaybeNullWhen(false)] out CSharpType itemType)
        {
            return IsListMethod(method, out itemType, out _);
        }

        private static ObjectTypeProperty? GetValueProperty(SchemaObjectType schemaObject, string pageingItemName)
        {
            return schemaObject.Properties.FirstOrDefault(p => p.SchemaProperty?.SerializedName == pageingItemName &&
                p.SchemaProperty?.FlattenedNames.Count == 0 && p.Declaration.Type.IsFrameworkType &&
                TypeFactory.IsList(p.Declaration.Type));
        }
    }
}
