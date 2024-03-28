// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class FlattenedObjectTypeProperty : ObjectTypeProperty
    {
        // The flattened object type property does not participate in the serialization or deserialization process, therefore we pass in null for SchemaProperty.
        internal FlattenedObjectTypeProperty(MemberDeclarationOptions declaration, string parameterDescription, ObjectTypeProperty underlyingProperty, bool isReadOnly, bool? includeGetterNullCheck, bool includeSetterNullCheck, string childPropertyName, bool isOverriddenValueType, CSharpType? valueType = null, bool optionalViaNullability = false)
            : base(declaration, parameterDescription, isReadOnly, null, valueType, optionalViaNullability)
        {
            UnderlyingProperty = underlyingProperty;
            IncludeGetterNullCheck = includeGetterNullCheck;
            IncludeSetterNullCheck = includeSetterNullCheck;
            IsUnderlyingPropertyNullable = underlyingProperty.IsReadOnly;
            ChildPropertyName = childPropertyName;
            IsOverriddenValueType = isOverriddenValueType;
        }

        // This is not immutable therefore we have to build this everytime we call it
        public override Stack<ObjectTypeProperty> BuildHierarchyStack() => GetHierarchyStack(UnderlyingProperty);

        public ObjectTypeProperty UnderlyingProperty { get; }

        public bool? IncludeGetterNullCheck { get; }

        public bool IncludeSetterNullCheck { get; }

        public bool IsUnderlyingPropertyNullable { get; }

        public bool IsOverriddenValueType { get; }

        public string ChildPropertyName { get; }

        public override string SerializedName => GetSerializedName();

        private string GetSerializedName()
        {
            StringBuilder result = new();
            foreach (var property in BuildHierarchyStack())
            {
                if (result.Length > 0)
                {
                    result.Insert(0, '.');
                }
                result.Insert(0, property.SerializedName);
            }
            return result.ToString();
        }

        internal static (bool IsReadOnly, bool? IncludeGetterNullCheck, bool IncludeSetterNullCheck) GetFlags(ObjectTypeProperty property, ObjectTypeProperty innerProperty)
        {
            if (!property.IsReadOnly && innerProperty.IsReadOnly)
            {
                if (HasDefaultPublicCtor(property.Declaration.Type))
                {
                    if (innerProperty.Declaration.Type.Arguments.Count > 0)
                        return (true, true, false);
                    else
                        return (true, false, false);
                }
                else
                {
                    return (false, false, false);
                }
            }
            else if (!property.IsReadOnly && !innerProperty.IsReadOnly)
            {
                if (HasDefaultPublicCtor(property.Declaration.Type))
                    return (false, false, true);
                else
                    return (false, false, false);
            }

            return (true, null, false);
        }

        private static bool HasDefaultPublicCtor(CSharpType type)
        {
            if (type is not { IsFrameworkType: false, Implementation: ObjectType objType })
                return true;

            foreach (var ctor in objType.Constructors)
            {
                if (ctor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) && !ctor.Signature.Parameters.Any())
                    return true;
            }

            return false;
        }

        internal static Stack<ObjectTypeProperty> GetHierarchyStack(ObjectTypeProperty property)
        {
            var hierarchyStack = new Stack<ObjectTypeProperty>();
            var visited = new HashSet<ObjectTypeProperty>();
            hierarchyStack.Push(property);
            visited.Add(property);
            BuildHeirarchy(property, hierarchyStack, visited);
            return hierarchyStack;
        }

        private static void BuildHeirarchy(ObjectTypeProperty property, Stack<ObjectTypeProperty> heirarchyStack, HashSet<ObjectTypeProperty> visited)
        {
            //if we get back the same property exit early since this means we are getting into a loop of references
            if (IsSinglePropertyObject(property, out var childProp) && !visited.Contains(childProp))
            {
                heirarchyStack.Push(childProp);
                visited.Add(childProp);
                BuildHeirarchy(childProp, heirarchyStack, visited);
            }
        }

        public static bool IsSinglePropertyObject(ObjectTypeProperty property, [MaybeNullWhen(false)] out ObjectTypeProperty innerProperty)
        {
            innerProperty = null;

            if (property.Declaration.Type is not { IsFrameworkType: false, Implementation: ObjectType objType })
                return false;

            var properties = objType.EnumerateHierarchy().SelectMany(obj => obj.Properties).Where(property => property is not FlattenedObjectTypeProperty).ToArray();
            bool isSingleProperty = properties.Length == 1 && objType.Discriminator == null;

            if (isSingleProperty)
                innerProperty = properties.First();

            return isSingleProperty;
        }

        internal static string GetCombinedPropertyName(ObjectTypeProperty innerProperty, ObjectTypeProperty immediateParentProperty)
        {
            var immediateParentPropertyName = GetPropertyName(immediateParentProperty.Declaration);

            if (innerProperty.Declaration.Type.Equals(typeof(bool)) || innerProperty.Declaration.Type.Equals(typeof(bool?)))
            {
                return innerProperty.Declaration.Name.Equals("Enabled", StringComparison.Ordinal) ? $"{immediateParentPropertyName}{innerProperty.Declaration.Name}" : innerProperty.Declaration.Name;
            }

            if (innerProperty.Declaration.Name.Equals("Id", StringComparison.Ordinal))
                return $"{immediateParentPropertyName}{innerProperty.Declaration.Name}";

            if (immediateParentPropertyName.EndsWith(innerProperty.Declaration.Name, StringComparison.Ordinal))
                return immediateParentPropertyName;

            var parentWords = immediateParentPropertyName.SplitByCamelCase();
            if (immediateParentPropertyName.EndsWith("Profile", StringComparison.Ordinal) ||
                immediateParentPropertyName.EndsWith("Policy", StringComparison.Ordinal) ||
                immediateParentPropertyName.EndsWith("Configuration", StringComparison.Ordinal) ||
                immediateParentPropertyName.EndsWith("Properties", StringComparison.Ordinal) ||
                immediateParentPropertyName.EndsWith("Settings", StringComparison.Ordinal))
            {
                parentWords = parentWords.Take(parentWords.Count() - 1);
            }

            var parentWordArray = parentWords.ToArray();
            var parentWordsHash = new HashSet<string>(parentWordArray);
            var nameWords = innerProperty.Declaration.Name.SplitByCamelCase().ToArray();
            var lastWord = string.Empty;
            for (int i = 0; i < nameWords.Length; i++)
            {
                var word = nameWords[i];
                lastWord = word;
                if (parentWordsHash.Contains(word))
                {
                    if (i == nameWords.Length - 2 && parentWordArray.Length >= 2 && word.Equals(parentWordArray[parentWordArray.Length - 2], StringComparison.Ordinal))
                    {
                        parentWords = parentWords.Take(parentWords.Count() - 2);
                        break;
                    }
                    {
                        return innerProperty.Declaration.Name;
                    }
                }

                //need to depluralize the last word and check
                if (i == nameWords.Length - 1 && parentWordsHash.Contains(lastWord.ToSingular(false)))
                    return innerProperty.Declaration.Name;
            }

            immediateParentPropertyName = string.Join("", parentWords);

            return $"{immediateParentPropertyName}{innerProperty.Declaration.Name}";
        }

        private static string GetPropertyName(MemberDeclarationOptions property)
        {
            const string properties = "Properties";
            if (property.Name.Equals(properties, StringComparison.Ordinal))
            {
                string typeName = property.Type.Name;
                int index = typeName.IndexOf(properties);
                if (index > -1 && index + properties.Length == typeName.Length)
                    return typeName.Substring(0, index);

                return typeName;
            }
            return property.Name;
        }
    }
}
