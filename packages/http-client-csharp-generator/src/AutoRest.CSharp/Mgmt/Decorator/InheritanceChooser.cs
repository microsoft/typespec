// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Generation;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    internal static class InheritanceChooser
    {
        internal const string ReferenceAttributeName = "ReferenceTypeAttribute";
        internal const string OptionalPropertiesName = "OptionalProperties";

        private static ConcurrentDictionary<Schema, CSharpType?> _valueCache = new ConcurrentDictionary<Schema, CSharpType?>();

        public static bool TryGetCachedExactMatch(Schema schema, out CSharpType? result)
        {
            return _valueCache.TryGetValue(schema, out result);
        }

        public static CSharpType? GetExactMatch(MgmtObjectType originalType, ObjectTypeProperty[] properties)
        {
            if (_valueCache.TryGetValue(originalType.ObjectSchema, out var result))
                return result;
            foreach (Type parentType in ReferenceClassFinder.GetReferenceClassCollection())
            {
                List<PropertyInfo> parentProperties = GetParentPropertiesToCompare(parentType, properties);
                if (PropertyMatchDetection.IsEqual(parentType, originalType, parentProperties, properties.ToList()))
                {
                    result = GetCSharpType(parentType);
                    _valueCache.TryAdd(originalType.ObjectSchema, result);
                    return result;
                }
            }
            _valueCache.TryAdd(originalType.ObjectSchema, null);
            return null;
        }

        public static CSharpType? GetSupersetMatch(MgmtObjectType originalType, ObjectTypeProperty[] properties)
        {
            foreach (System.Type parentType in ReferenceClassFinder.GetReferenceClassCollection())
            {
                if (IsSuperset(parentType, originalType, properties))
                {
                    return GetCSharpType(parentType);
                }
            }
            return null;
        }

        private static CSharpType GetCSharpType(Type parentType)
        {
            return CSharpType.FromSystemType(MgmtContext.Context, parentType);
        }

        private static List<PropertyInfo> GetParentPropertiesToCompare(Type parentType, ObjectTypeProperty[] properties)
        {
            var propertyNames = properties.Select(p => p.Declaration.Name).ToHashSet();
            var attributeObj = parentType.GetCustomAttributes()?.Where(a => a.GetType().Name == ReferenceAttributeName).First();
            var optionalPropertiesForMatch = new HashSet<string>((attributeObj?.GetType().GetProperty(OptionalPropertiesName)?.GetValue(attributeObj) as string[])!);
            List<PropertyInfo> parentProperties = parentType.GetProperties(BindingFlags.Public | BindingFlags.Instance).Where(p => !optionalPropertiesForMatch.Contains(p.Name) || propertyNames.Contains(p.Name)).ToList();
            return parentProperties;
        }

        private static bool IsSuperset(Type parentType, MgmtObjectType originalType, ObjectTypeProperty[] properties)
        {
            var childProperties = properties.ToList();
            List<PropertyInfo> parentProperties = GetParentPropertiesToCompare(parentType, properties);
            if (parentProperties.Count >= childProperties.Count)
                return false;

            Dictionary<string, PropertyInfo> parentDict = new Dictionary<string, PropertyInfo>();
            int matchCount = 0;
            foreach (var parentProperty in parentProperties)
            {
                parentDict.Add(parentProperty.Name, parentProperty);
            }

            foreach (var childProperty in childProperties)
            {
                if (parentProperties.Count == matchCount)
                    break;

                if (PropertyMatchDetection.DoesPropertyExistInParent(parentType, originalType, childProperty, parentDict))
                    matchCount++;
            }

            return parentProperties.Count == matchCount;
        }
    }
}
