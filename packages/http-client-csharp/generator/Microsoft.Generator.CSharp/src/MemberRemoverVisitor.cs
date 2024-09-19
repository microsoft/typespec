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
        protected override MethodProvider? Visit(MethodProvider methodProvider)
        {
            foreach (var attribute in GetMemberSuppressionAttributes(methodProvider.EnclosingType))
            {
                if (ShouldRemove(methodProvider.EnclosingType, methodProvider.Signature, attribute))
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
                if (ShouldRemove(constructorProvider.EnclosingType, constructorProvider.Signature, attribute))
                {
                    return null;
                }
            }

            return constructorProvider;
        }

        protected override PropertyProvider? Visit(PropertyProvider propertyProvider)
        {
            foreach (var attribute in GetMemberSuppressionAttributes(propertyProvider.EnclosingType))
            {
                if (ShouldRemove(propertyProvider, attribute))
                {
                    return null;
                }
            }

            return propertyProvider;
        }

        private static IEnumerable<AttributeData> GetMemberSuppressionAttributes(TypeProvider typeProvider)
            => typeProvider.CustomCodeView?.GetAttributes()?.Where(a => a.AttributeClass?.Name == CodeGenAttributes.CodeGenSuppressAttributeName) ?? [];

        private static bool ShouldRemove(TypeProvider enclosingType, MethodSignatureBase signature, AttributeData attribute)
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

        private static bool ShouldRemove(PropertyProvider propertyProvider, AttributeData attribute)
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
