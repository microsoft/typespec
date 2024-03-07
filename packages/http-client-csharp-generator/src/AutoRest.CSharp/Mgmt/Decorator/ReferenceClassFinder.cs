// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Reflection;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core.Expressions.DataFactory;
using Azure.ResourceManager;
using Azure.ResourceManager.Models;
using Operation = Azure.Operation;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    public class ReferenceClassFinder
    {
        internal const string InitializationCtorAttribute = "InitializationConstructor";
        internal const string SerializationCtorAttribute = "SerializationConstructor";
        internal const string ReferenceTypeAttribute = "ReferenceType";

        internal const string InitializationCtorAttributeName = "InitializationConstructorAttribute";
        internal const string SerializationCtorAttributeName = "SerializationConstructorAttribute";
        internal const string ReferenceTypeAttributeName = "ReferenceTypeAttribute";

        internal const string PropertyReferenceTypeAttribute = "PropertyReferenceType";
        internal const string PropertyReferenceTypeAttributeName = "PropertyReferenceTypeAttribute";

        internal const string TypeReferenceTypeAttribute = "TypeReferenceType";
        internal const string TypeReferenceTypeAttributeName = "TypeReferenceTypeAttribute";

        public record PropertyMetadata(string SerializedName, bool Required)
        {
            public PropertyMetadata(string serializedName) : this(serializedName, false)
            {
            }
        }

        private static readonly Dictionary<Type, Dictionary<string, PropertyMetadata>> _referenceTypesPropertyMetadata = new()
        {
            [typeof(ResourceData)] = new()
            {
                ["Id"] = new PropertyMetadata("id", true),
                ["Name"] = new PropertyMetadata("name", true),
                ["ResourceType"] = new PropertyMetadata("type", true),
                ["SystemData"] = new PropertyMetadata("systemData", false),
            },
            [typeof(TrackedResourceData)] = new()
            {
                ["Id"] = new PropertyMetadata("id", true),
                ["Name"] = new PropertyMetadata("name", true),
                ["ResourceType"] = new PropertyMetadata("type", true),
                ["SystemData"] = new PropertyMetadata("systemData", false),
                ["Location"] = new PropertyMetadata("location", true),
                ["Tags"] = new PropertyMetadata("tags"),
            },
            [typeof(ManagedServiceIdentity)] = new()
            {
                ["PrincipalId"] = new PropertyMetadata("principalId"),
                ["TenantId"] = new PropertyMetadata("tenantId"),
                ["ManagedServiceIdentityType"] = new PropertyMetadata("type", true),
                ["UserAssignedIdentities"] = new PropertyMetadata("userAssignedIdentities"),
            },
            [typeof(SystemData)] = new()
            {
                ["CreatedBy"] = new PropertyMetadata("createdBy"),
                ["CreatedByType"] = new PropertyMetadata("createdByType"),
                ["CreatedOn"] = new PropertyMetadata("createdAt"),
                ["LastModifiedBy"] = new PropertyMetadata("lastModifiedBy"),
                ["LastModifiedByType"] = new PropertyMetadata("lastModifiedByType"),
                ["LastModifiedOn"] = new PropertyMetadata("lastModifiedAt")
            },
            [typeof(ResponseError)] = new()
            {
                ["Code"] = new PropertyMetadata("code", true),
                ["Message"] = new PropertyMetadata("message", true),
                ["Target"] = new PropertyMetadata("target"),
                ["Details"] = new PropertyMetadata("details")
            },
            [typeof(DataFactoryLinkedServiceReference)] = new()
            {
                ["ReferenceType"] = new PropertyMetadata("type", true),
                ["ReferenceName"] = new PropertyMetadata("referenceName", true),
                ["Parameters"] = new PropertyMetadata("parameters")
            }
        };

        public static bool TryGetPropertyMetadata(Type type, [MaybeNullWhen(false)] out Dictionary<string, PropertyMetadata> dict)
        {
            dict = null;
            if (_referenceTypesPropertyMetadata.TryGetValue(type, out dict))
                return dict != null;

            if (TryConstructPropertyMetadata(type, out dict))
            {
                _referenceTypesPropertyMetadata.Add(type, dict);
                return true;
            }

            return false;
        }

        public static Dictionary<string, PropertyMetadata> GetPropertyMetadata(Type type)
        {
            if (_referenceTypesPropertyMetadata.TryGetValue(type, out var dict))
                return dict;
            dict = ConstructPropertyMetadata(type);
            _referenceTypesPropertyMetadata.Add(type, dict);
            return dict;
        }

        private static bool TryConstructPropertyMetadata(Type type, [MaybeNullWhen(false)] out Dictionary<string, PropertyMetadata> dict)
        {
            var publicCtor = type.GetConstructors().Where(c => c.IsPublic).OrderBy(c => c.GetParameters().Count()).FirstOrDefault();
            if (publicCtor == null && !type.IsAbstract)
            {
                dict = null;
                return false;
            }
            dict = new Dictionary<string, PropertyMetadata>();
            var internalPropertiesToInclude = new List<PropertyInfo>();
            PropertyMatchDetection.AddInternalIncludes(type, internalPropertiesToInclude);
            foreach (var property in type.GetProperties().Where(p => p.DeclaringType == type).Concat(internalPropertiesToInclude))
            {
                var metadata = new PropertyMetadata(property.Name.ToVariableName(), publicCtor != null && GetRequired(publicCtor, property));
                dict.Add(property.Name, metadata);
            }
            return true;
        }

        private static Dictionary<string, PropertyMetadata> ConstructPropertyMetadata(Type type)
        {
            if (TryConstructPropertyMetadata(type, out var dict))
                return dict;

            throw new InvalidOperationException($"Property metadata information for type {type} cannot be constructed automatically because it does not have a public constructor");
        }

        private static bool GetRequired(ConstructorInfo publicCtor, PropertyInfo property)
            => publicCtor.GetParameters().Any(param => param.Name?.Equals(property.Name, StringComparison.OrdinalIgnoreCase) == true && param.GetType() == property.GetType());

        private static IList<Type>? _externalTypes;
        private static IList<Type>? _referenceTypes;

        internal class Node
        {
            public Type Type { get; }
            public List<Node> Children { get; }

            public Node(Type type)
            {
                Type = type;
                Children = new List<Node>();
            }
        }

        /// <summary>
        /// All external types, right now they are all defined in Azure.Core, Azure.Core.Expressions.DataFactory, and Azure.ResourceManager.
        /// See: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/resourcemanager/Azure.ResourceManager/src
        ///      https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/src
        ///      https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core.Expressions.DataFactory/src
        /// </summary>
        internal static IList<Type> ExternalTypes => _externalTypes ??= GetExternalTypes();
        internal static IList<Type> GetReferenceClassCollection() => _referenceTypes ??= GetOrderedList(GetReferenceClassCollectionInternal());

        internal static IEnumerable<Type> GetPropertyReferenceClassCollection()
            => ExternalTypes.Where(t => IsPropertyReferenceType(t) && !IsObsolete(t));

        internal static IReadOnlyList<System.Type> GetTypeReferenceTypes()
            => ExternalTypes.Where(t => IsTypeReferenceType(t)).ToList();

        private static IList<Type> GetExternalTypes()
        {
            var assembly = Assembly.GetAssembly(typeof(ArmClient));
            List<Type> types = new List<Type>();
            if (assembly != null)
                types.AddRange(assembly.GetTypes());

            assembly = Assembly.GetAssembly(typeof(Operation));
            if (assembly != null)
                types.AddRange(assembly.GetTypes());

            if (Configuration.UseCoreDataFactoryReplacements)
            {
                assembly = Assembly.GetAssembly(typeof(DataFactoryElement<>));
                if (assembly != null)
                    types.AddRange(assembly.GetTypes());
            }

            return types;
        }

        private static IList<Type> GetReferenceClassCollectionInternal()
            => ExternalTypes.Where(t => IsReferenceType(t) && !IsObsolete(t)).ToList();

        internal static bool HasAttribute(Type type, string attributeName)
            => type.GetCustomAttributes(false).Where(a => a.GetType().Name == attributeName).Any();

        private static bool IsReferenceType(Type type) => HasAttribute(type, ReferenceTypeAttributeName);

        private static bool IsPropertyReferenceType(Type type) => HasAttribute(type, PropertyReferenceTypeAttributeName);

        private static bool IsTypeReferenceType(Type type) => HasAttribute(type, TypeReferenceTypeAttributeName);

        private static bool IsObsolete(Type type)
            => type.GetCustomAttributes(false).Where(a => a.GetType() == typeof(ObsoleteAttribute)).Any();

        internal static List<Type> GetOrderedList(IList<Type> referenceTypes)
        {
            var rootNodes = GetRootNodes(referenceTypes);
            rootNodes.Sort((a, b) => a.Type.GetProperties(BindingFlags.Instance | BindingFlags.Public).Length.CompareTo(b.Type.GetProperties(BindingFlags.Instance | BindingFlags.Public).Length) * -1);
            var output = new List<Type>();
            foreach (var root in rootNodes)
            {
                var treeNodes = new List<Type>();
                Queue<Node> queue = new Queue<Node>();
                queue.Enqueue(root);
                while (queue.Count != 0)
                {
                    Node tempNode = queue.Dequeue();
                    treeNodes.Add(tempNode.Type);
                    List<Node> tempChildren = tempNode.Children;
                    if (tempChildren != null)
                    {
                        int childNum = tempChildren.Count;
                        while (childNum > 0)
                        {
                            queue.Enqueue(tempChildren[childNum - 1]);
                            childNum--;
                        }
                    }
                }
                treeNodes.Reverse();
                output.AddRange(PromoteGenericType(treeNodes));
            }
            return output;
        }

        private static List<Type> PromoteGenericType(List<Type> output)
        {
            bool swapped = false;
            for (int i = 0; i < output.Count; i++)
            {
                if (output[i].IsGenericType)
                {
                    // since we need to ensure the base generic type is before
                    // any other inheritors we just need to search behind
                    for (int j = i - 1; j > -1; j--)
                    {
                        if (output[j].IsGenericType == false
                            && output[j].BaseType == output[i])
                        {

                            System.Type temp = output[j];
                            output[j] = output[i];
                            output[i] = temp;
                            swapped = true;
                        }
                    }
                }
            }
            if (swapped)
                return PromoteGenericType(output);

            return output;
        }

        internal static List<Node> GetRootNodes(IList<Type> referenceClassCollection)
        {
            List<Node> rootNodes = new List<Node>();
            var added = new Dictionary<Type, Node>();
            var rootHash = new Dictionary<Type, List<Node>>();
            foreach (System.Type reference in referenceClassCollection)
            {
                if (!added.ContainsKey(reference))
                {
                    Node node = new Node(reference);
                    System.Type baseType = reference.BaseType ?? typeof(object);
                    if (baseType != typeof(object) && added.ContainsKey(baseType))
                    {
                        added[baseType].Children.Add(node);
                    }
                    else
                    {
                        if (rootHash.ContainsKey(node.Type))
                        {
                            foreach (var child in rootHash[node.Type])
                            {
                                node.Children.Add(child);
                                rootNodes.Remove(child);
                            }
                            rootHash.Remove(baseType);
                        }
                        else
                        {
                            if (baseType != typeof(object))
                            {
                                List<Node>? list;
                                if (!rootHash.TryGetValue(baseType, out list))
                                {
                                    list = new List<Node>();
                                    rootHash.Add(baseType, list);
                                }
                                list.Add(node);
                            }
                        }
                        rootNodes.Add(node);
                    }
                    added.Add(reference, node);
                }
            }
            return rootNodes;
        }
    }
}
