// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.SourceInput;

namespace Microsoft.Generator.CSharp
{
    internal class MemberRemoverVisitor : LibraryVisitor
    {
        private readonly IDictionary<TypeProvider, HashSet<string>> _customPropertyNames = new Dictionary<TypeProvider, HashSet<string>>();
        protected override MethodProvider? Visit(MethodProvider methodProvider)
        {
            foreach (var attribute in GetMemberSuppressionAttributes(methodProvider.EnclosingType))
            {
                if (IsMatch(methodProvider.EnclosingType, methodProvider.Signature, attribute))
                {
                    return null;
                }
            }

            return methodProvider;
        }

        protected override ConstructorProvider? Visit(ConstructorProvider constructorProvider)
        {
            foreach (var attribute in GetMemberSuppressionAttributes(constructorProvider.EnclosingType))
            {
                if (IsMatch(constructorProvider.EnclosingType, constructorProvider.Signature, attribute))
                {
                    return null;
                }
            }

            var customConstructors = constructorProvider.EnclosingType.CustomCodeView?.Constructors ?? [];
            foreach (var customConstructor in customConstructors)
            {
                if (IsMatch(customConstructor, constructorProvider))
                {
                    return null;
                }
            }
            return constructorProvider;
        }

        private static bool IsMatch(ConstructorProvider customConstructor, ConstructorProvider constructor)
        {
            if (customConstructor.Signature.Parameters.Count != constructor.Signature.Parameters.Count)
            {
                return false;
            }

            for (int i = 0; i < customConstructor.Signature.Parameters.Count; i++)
            {
                if (customConstructor.Signature.Parameters[i].Type.Name != constructor.Signature.Parameters[i].Type.Name)
                {
                    return false;
                }
            }

            return true;
        }

        protected override PropertyProvider? Visit(PropertyProvider propertyProvider)
        {
            foreach (var attribute in GetMemberSuppressionAttributes(propertyProvider.EnclosingType))
            {
                if (IsMatch(propertyProvider, attribute))
                {
                    return null;
                }
            }

            if (!_customPropertyNames.TryGetValue(propertyProvider.EnclosingType, out var customPropertyNames))
            {
                customPropertyNames = new HashSet<string>();
                _customPropertyNames[propertyProvider.EnclosingType] = customPropertyNames;
                foreach (var customProperty in propertyProvider.EnclosingType.CustomCodeView?.Properties ?? [])
                {
                    // Add the actual custom property name
                    customPropertyNames.Add(customProperty.Name);
                    foreach (var attribute in customProperty.Attributes ?? [])
                    {
                        // Add the name of the property that the custom property is replacing
                        if (CodeGenAttributes.TryGetCodeGenMemberAttributeValue(attribute, out var name))
                        {
                            customPropertyNames.Add(name);
                        }
                    }
                }
            }

            // Don't generate properties that are replaced by custom properties
            return customPropertyNames.Contains(propertyProvider.Name) ? null : propertyProvider;
        }

        private static IEnumerable<AttributeData> GetMemberSuppressionAttributes(TypeProvider typeProvider)
            => typeProvider.CustomCodeView?.GetAttributes()?.Where(a => a.AttributeClass?.Name == CodeGenAttributes.CodeGenSuppressAttributeName) ?? [];

        private static bool IsMatch(TypeProvider enclosingType, MethodSignatureBase signature, AttributeData attribute)
        {
            ValidateArguments(enclosingType, attribute);
            var name = attribute.ConstructorArguments[0].Value as string;
            if (name != signature.Name)
            {
                return false;
            }

            ISymbol?[]? parameterTypes;
            if (attribute.ConstructorArguments.Length == 1)
            {
                parameterTypes = [];
            }
            else if (attribute.ConstructorArguments[1].Kind != TypedConstantKind.Array)
            {
                parameterTypes = [(ISymbol?) attribute.ConstructorArguments[1].Value];
            }
            else
            {
                parameterTypes = attribute.ConstructorArguments[1].Values.Select(v => (ISymbol?)v.Value).ToArray();
            }
            if (parameterTypes.Length != signature.Parameters.Count)
            {
                return false;
            }

            for (int i = 0; i < parameterTypes.Length; i++)
            {
                if (parameterTypes[i]?.Name != signature.Parameters[i].Type.Name)
                {
                    return false;
                }
            }

            return true;
        }

        private static bool IsMatch(PropertyProvider propertyProvider, AttributeData attribute)
        {
            ValidateArguments(propertyProvider.EnclosingType, attribute);
            var name = attribute.ConstructorArguments[0].Value as string;
            return name == propertyProvider.Name;
        }

        private static void ValidateArguments(TypeProvider type, AttributeData attributeData)
        {
            var arguments = attributeData.ConstructorArguments;
            if (arguments.Length == 0)
            {
                throw new InvalidOperationException($"CodeGenSuppress attribute on {type.Name} must specify a method, constructor, or property name as its first argument.");
            }

            if (arguments[0].Kind != TypedConstantKind.Primitive || arguments[0].Value is not string)
            {
                var attribute = GetText(attributeData.ApplicationSyntaxReference);
                throw new InvalidOperationException($"{attribute} attribute on {type.Name} must specify a method, constructor, or property name as its first argument.");
            }

            if (arguments.Length == 2 && arguments[1].Kind == TypedConstantKind.Array)
            {
                ValidateTypeArguments(type, attributeData, arguments[1].Values);
            }
            else
            {
                ValidateTypeArguments(type, attributeData, arguments.Skip(1));
            }
        }

        private static void ValidateTypeArguments(TypeProvider type, AttributeData attributeData, IEnumerable<TypedConstant> arguments)
        {
            foreach (var argument in arguments)
            {
                if (argument.Kind == TypedConstantKind.Type)
                {
                    if (argument.Value is IErrorTypeSymbol errorType)
                    {
                        var attribute = GetText(attributeData.ApplicationSyntaxReference);
                        var fileLinePosition = GetFileLinePosition(attributeData.ApplicationSyntaxReference);
                        var filePath = fileLinePosition.Path;
                        var line = fileLinePosition.StartLinePosition.Line + 1;
                        throw new InvalidOperationException($"The undefined type '{errorType.Name}' is referenced in the '{attribute}' attribute ({filePath}, line: {line}). Please define this type or remove it from the attribute.");
                    }
                }
                else
                {
                    var attribute = GetText(attributeData.ApplicationSyntaxReference);
                    throw new InvalidOperationException($"Argument '{argument.ToCSharpString()}' in attribute '{attribute}' applied to '{type.Name}' must be a type.");
                }
            }
        }

        private static string GetText(SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetText().ToString(syntaxReference.Span) ?? string.Empty;

        private static FileLinePositionSpan GetFileLinePosition(SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetLocation(syntaxReference.Span).GetLineSpan() ?? default;
    }
}
