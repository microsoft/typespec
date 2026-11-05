// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    // Lexical ownership only, not parameter/local type evidence or call selection.
    // One unused scalar parameter, one unused closed metadata/default declaration,
    // then one explicit unqualified invocation. No general local binder or CFG.
    internal static class PreparedOwnedGenericBlockScope
    {
        internal static InvokeMethodExpression? GetInvocation(MethodProvider method)
        {
            var signature = method.Signature;
            if (signature.Modifiers != MethodSignatureModifiers.Public ||
                signature.GenericArguments is not null &&
                    (!ContractCollections.TryCopy(signature.GenericArguments, out var genericParameters) || !genericParameters.IsEmpty) ||
                !ContractCollections.TryCopy(signature.Parameters, out var parameters) || parameters.Length != 1 ||
                parameters[0] is null || parameters[0].GetType() != typeof(ParameterProvider) || parameters[0].IsRef || parameters[0].IsIn || parameters[0].IsOut ||
                !IsRuntimeType(parameters[0].Type, typeof(object)) || signature.ReturnType is null ||
                !IsRuntimeType(signature.ReturnType, typeof(object)) ||
                method.BodyStatements is not { } statements || statements.GetType() != typeof(MethodBodyStatements) ||
                !ContractCollections.TryCopy(((MethodBodyStatements)statements).Statements, out var body) || body.Length != 2 ||
                body[0] is not ExpressionStatement localStatement || localStatement.GetType() != typeof(ExpressionStatement) ||
                localStatement.Expression is not AssignmentExpression assignment || assignment.GetType() != typeof(AssignmentExpression) || assignment.UseNullCoalesce ||
                assignment.Variable is not DeclarationExpression declaration || declaration.GetType() != typeof(DeclarationExpression) ||
                declaration.IsOut || declaration.IsUsing || declaration.IsConst ||
                declaration.Variable is null || declaration.Variable.GetType() != typeof(VariableExpression) ||
                declaration.Variable.Declaration is null || !IsRuntimeType(declaration.Variable.Type, typeof(Exception)) ||
                assignment.Value is not KeywordExpression initializer || initializer.GetType() != typeof(KeywordExpression) ||
                initializer.Keyword != "default" || initializer.Expression is not null ||
                body[1] is not ExpressionStatement returnStatement || returnStatement.GetType() != typeof(ExpressionStatement) ||
                returnStatement.Expression is not KeywordExpression returned || returned.GetType() != typeof(KeywordExpression) || returned.Keyword != "return" ||
                returned.Expression is not InvokeMethodExpression call || call.GetType() != typeof(InvokeMethodExpression) ||
                call.InstanceReference is not null || call.CallAsAsync || call.ExtensionType is not null ||
                call.IsReducedExtensionIntent || call.DelegateParameterIntent is not null ||
                !ContractCollections.TryCopy(call.Arguments, out var arguments) ||
                call.TypeArguments is not null && !ContractCollections.TryCopy(call.TypeArguments, out _))
            {
                return null;
            }
            var explicitGeneric = arguments.IsEmpty && call.TypeArguments is not null &&
                ContractCollections.TryCopy(call.TypeArguments, out var explicitTypes) && explicitTypes.Length == 1;
            var originalTypeOf = arguments.Length == 1 && arguments[0] is TypeOfExpression operand &&
                operand.GetType() == typeof(TypeOfExpression) && IsRuntimeType(operand.Type, typeof(Exception)) &&
                !operand.Type.IsLiteral && operand.Type.DeclaringType is null &&
                (call.TypeArguments is null || ContractCollections.TryCopy(call.TypeArguments, out var ordinaryTypes) && ordinaryTypes.IsEmpty);
            var originalConstruction = arguments.Length == 1 && IsOriginalConstructionArgument(arguments[0]) &&
                (call.TypeArguments is null || ContractCollections.TryCopy(call.TypeArguments, out var constructionTypes) && constructionTypes.IsEmpty);
            if (!explicitGeneric && !originalTypeOf && !originalConstruction) { return null; }
            var name = call.MethodSignature?.Name ?? call.MethodName;
            var parameterName = parameters[0].EmittedDeclarationState.Name;
            var localName = declaration.Variable.Declaration.RequestedName;
            if (!Identifier(name) || !Identifier(parameterName) || !Identifier(localName) ||
                parameterName == localName || parameterName == name || localName == name ||
                ReferenceEquals(parameters[0].CachedVariableExpression?.Declaration, declaration.Variable.Declaration) ||
                // The writer allocates collisions by adding numeric suffixes. A
                // digit-ended callee could otherwise become a newly allocated name.
                char.IsDigit(name![name.Length - 1])) { return null; }
            return call;
        }

        private static bool Identifier(string? name) => !string.IsNullOrEmpty(name) &&
            SyntaxFacts.IsValidIdentifier(name) && SyntaxFacts.GetKeywordKind(name) == SyntaxKind.None &&
            (name[0] is >= 'A' and <= 'Z' or >= 'a' and <= 'z' or '_') &&
            System.Linq.Enumerable.All(name, c => c is >= 'A' and <= 'Z' or >= 'a' and <= 'z' or >= '0' and <= '9' or '_');

        // Written shape only: the unused declaration is outside this argument.
        // This supplies neither constructor selection nor constructor-name permission.
        internal static bool IsOriginalConstructionArgument(ValueExpression argument) =>
            argument is NewInstanceExpression creation && creation.GetType() == typeof(NewInstanceExpression) &&
            creation.Type is { IsLiteral: false, DeclaringType: null } type && IsRuntimeType(type, typeof(Exception)) &&
            ContractCollections.TryCopy(creation.Parameters, out var arguments) && arguments.IsEmpty &&
            creation.InitExpression is null && creation.ConstructorIntent is null && creation.ConstructorProviderIntent is null;

        private static bool IsRuntimeType(CSharpType type, Type expected) => type is not null && type.GetType() == typeof(CSharpType) &&
            type.IsFrameworkType && type.FrameworkType.GetType() == typeof(object).GetType() &&
            ReferenceEquals(type.FrameworkType, expected) && !type.IsNullable && !type.HasUnionMetadata &&
            ContractCollections.TryCopy(type.Arguments, out var arguments) && arguments.IsEmpty &&
            type.Name == expected.Name && type.Namespace == expected.Namespace;
    }
}
