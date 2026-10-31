// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;

namespace Microsoft.TypeSpec.Generator
{
    // Bounded attribute-name materialization and contract proof, not a general
    // semantic-equivalence engine. Unknown operation shapes retain qualification.
    internal static class StructuralAttributeRules
    {
        internal static NameSyntax? WithoutSuffix(NameSyntax name)
        {
            var terminal = name switch
            {
                IdentifierNameSyntax identifier => identifier,
                QualifiedNameSyntax { Right: IdentifierNameSyntax identifier } => identifier,
                AliasQualifiedNameSyntax { Name: IdentifierNameSyntax identifier } => identifier,
                _ => null
            };
            if (terminal == null)
            {
                return null;
            }

            const string suffix = "Attribute";
            var token = terminal.Identifier;
            if (!token.Text.EndsWith(suffix, StringComparison.Ordinal) || !token.ValueText.EndsWith(suffix, StringComparison.Ordinal) ||
                token.ValueText.Length == suffix.Length)
            {
                return null;
            }

            var value = token.ValueText[..^suffix.Length];
            // Constructed identifiers can bind despite invalid serialized keyword
            // syntax. Keep contextual forms too, including newer-consumer field.
            if (SyntaxFacts.GetKeywordKind(value) != SyntaxKind.None || SyntaxFacts.GetContextualKeywordKind(value) != SyntaxKind.None || value == "field")
            {
                return null;
            }

            var shortened = SyntaxFactory.IdentifierName(SyntaxFactory.Identifier(token.LeadingTrivia, SyntaxKind.None,
                token.Text[..^suffix.Length], value, token.TrailingTrivia));
            return name.ReplaceNode(terminal, shortened);
        }

        internal static NameSyntax? RoundTripName(NameSyntax name, CSharpParseOptions options)
        {
            var spelling = name.ToString();
            var parsed = SyntaxFactory.ParseCompilationUnit("[" + spelling + "] class __AttributeProof__ {}", options: options);
            if (parsed.ContainsDiagnostics)
            {
                return null;
            }

            var attributes = parsed.DescendantNodes().OfType<AttributeSyntax>().ToArray();
            if (attributes.Length != 1 || attributes[0].Name.ToString() != spelling)
            {
                return null;
            }

            return attributes[0].Name;
        }

        private static bool Symbol(ISymbol? left, ISymbol? right) => SymbolEqualityComparer.IncludeNullability.Equals(left, right);

        private static bool Conversion(CommonConversion left, CommonConversion right) =>
            left.Exists == right.Exists && left.IsIdentity == right.IsIdentity && left.IsNumeric == right.IsNumeric &&
            left.IsReference == right.IsReference && left.IsNullable == right.IsNullable && left.IsImplicit == right.IsImplicit &&
            left.IsUserDefined == right.IsUserDefined && Symbol(left.MethodSymbol, right.MethodSymbol);

        internal static bool SameContract(IOperation? left, IOperation? right)
        {
            if (left == null || right == null || left.Type?.TypeKind is TypeKind.Error or TypeKind.Dynamic or TypeKind.Pointer or TypeKind.FunctionPointer ||
                right.Type?.TypeKind is TypeKind.Error or TypeKind.Dynamic or TypeKind.Pointer or TypeKind.FunctionPointer ||
                left.Kind != right.Kind || !Symbol(left.Type, right.Type) ||
                left.IsImplicit != right.IsImplicit || left.ConstantValue.HasValue != right.ConstantValue.HasValue ||
                left.ConstantValue.HasValue && !Equals(left.ConstantValue.Value, right.ConstantValue.Value))
            {
                return false;
            }

            var same = (left, right) switch
            {
                (IAttributeOperation, IAttributeOperation) => true,
                (IObjectCreationOperation a, IObjectCreationOperation b) => a.Constructor != null && Symbol(a.Constructor, b.Constructor),
                (IArgumentOperation a, IArgumentOperation b) => a.ArgumentKind == b.ArgumentKind && a.Parameter != null &&
                    Symbol(a.Parameter, b.Parameter) && a.Parameter.RefKind == b.Parameter?.RefKind &&
                    Conversion(a.InConversion, b.InConversion) && Conversion(a.OutConversion, b.OutConversion),
                (ISimpleAssignmentOperation a, ISimpleAssignmentOperation b) => a.IsRef == b.IsRef,
                (IPropertyReferenceOperation a, IPropertyReferenceOperation b) => Symbol(a.Property, b.Property),
                (IFieldReferenceOperation a, IFieldReferenceOperation b) => Symbol(a.Field, b.Field) && a.IsDeclaration == b.IsDeclaration,
                (IParameterReferenceOperation a, IParameterReferenceOperation b) => Symbol(a.Parameter, b.Parameter),
                (IMethodReferenceOperation a, IMethodReferenceOperation b) => Symbol(a.Method, b.Method),
                (IInstanceReferenceOperation a, IInstanceReferenceOperation b) => a.ReferenceKind == b.ReferenceKind,
                (IConversionOperation a, IConversionOperation b) => a.IsChecked == b.IsChecked && a.IsTryCast == b.IsTryCast &&
                    Symbol(a.OperatorMethod, b.OperatorMethod) && Conversion(a.Conversion, b.Conversion),
                (ITypeOfOperation a, ITypeOfOperation b) => Symbol(a.TypeOperand, b.TypeOperand),
                (IUnaryOperation a, IUnaryOperation b) => a.OperatorKind == b.OperatorKind && a.IsChecked == b.IsChecked &&
                    a.IsLifted == b.IsLifted && Symbol(a.OperatorMethod, b.OperatorMethod),
                (IBinaryOperation a, IBinaryOperation b) => a.OperatorKind == b.OperatorKind && a.IsChecked == b.IsChecked &&
                    a.IsLifted == b.IsLifted && Symbol(a.OperatorMethod, b.OperatorMethod),
                (ILiteralOperation, ILiteralOperation) or (IDefaultValueOperation, IDefaultValueOperation) or
                (INameOfOperation, INameOfOperation) or (IArrayCreationOperation, IArrayCreationOperation) or
                (IArrayInitializerOperation, IArrayInitializerOperation) or
                (IObjectOrCollectionInitializerOperation, IObjectOrCollectionInitializerOperation) or
                (IParenthesizedOperation, IParenthesizedOperation) => true,
                _ => false
            };
            if (!same)
            {
                return false;
            }

            var first = left.ChildOperations.GetEnumerator();
            var second = right.ChildOperations.GetEnumerator();
            while (first.MoveNext())
            {
                if (!second.MoveNext() || !SameContract(first.Current, second.Current))
                {
                    return false;
                }
            }

            return !second.MoveNext();
        }
    }
}
