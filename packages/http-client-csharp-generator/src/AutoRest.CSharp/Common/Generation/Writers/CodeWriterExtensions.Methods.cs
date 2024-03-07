// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using AutoRest.CSharp.Common.Output.Expressions.KnownCodeBlocks;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using Azure.ResourceManager.Models;
using SwitchExpression = AutoRest.CSharp.Common.Output.Expressions.ValueExpressions.SwitchExpression;

namespace AutoRest.CSharp.Generation.Writers
{
    internal static partial class CodeWriterExtensions
    {
        private const int SingleLineParameterThreshold = 6;

        public static void WriteMethodBodyStatement(this CodeWriter writer, MethodBodyStatement bodyStatement)
        {
            switch (bodyStatement)
            {
                case InvokeInstanceMethodStatement(var instance, var methodName, var arguments, var callAsAsync):
                    writer.WriteValueExpression(new InvokeInstanceMethodExpression(instance, methodName, arguments, null, callAsAsync));
                    writer.LineRaw(";");
                    break;
                case InvokeStaticMethodStatement(var methodType, var methodName, var arguments, var typeArguments, var callAsExtension, var callAsAsync):
                    writer.WriteValueExpression(new InvokeStaticMethodExpression(methodType, methodName, arguments, typeArguments, callAsExtension, callAsAsync));
                    writer.LineRaw(";");
                    break;
                case ParameterValidationBlock(var parameters, var isLegacy):
                    if (isLegacy)
                    {
                        writer.WriteParameterNullChecks(parameters);
                    }
                    else
                    {
                        writer.WriteParametersValidation(parameters);
                    }
                    break;
                case DiagnosticScopeMethodBodyBlock diagnosticScope:
                    using (writer.WriteDiagnosticScope(diagnosticScope.Diagnostic, diagnosticScope.ClientDiagnosticsReference))
                    {
                        WriteMethodBodyStatement(writer, diagnosticScope.InnerStatement);
                    }
                    break;
                case IfStatement ifStatement:
                    writer.AppendRaw("if (");
                    writer.WriteValueExpression(ifStatement.Condition);

                    if (ifStatement.Inline)
                    {
                        writer.AppendRaw(") ");
                        using (writer.AmbientScope())
                        {
                            WriteMethodBodyStatement(writer, ifStatement.Body);
                        }
                    }
                    else
                    {
                        writer.LineRaw(")");
                        using (ifStatement.AddBraces ? writer.Scope() : writer.AmbientScope())
                        {
                            WriteMethodBodyStatement(writer, ifStatement.Body);
                        }
                    }

                    break;
                case IfElseStatement(var ifBlock, var elseBlock):
                    writer.WriteMethodBodyStatement(ifBlock);
                    if (elseBlock is not null)
                    {
                        if (ifBlock.Inline || !ifBlock.AddBraces)
                        {
                            using (writer.AmbientScope())
                            {
                                writer.AppendRaw("else ");
                                if (!ifBlock.Inline)
                                {
                                    writer.Line();
                                }
                                WriteMethodBodyStatement(writer, elseBlock);
                            }
                        }
                        else
                        {
                            using (writer.Scope($"else"))
                            {
                                WriteMethodBodyStatement(writer, elseBlock);
                            }
                        }
                    }

                    break;
                case IfElsePreprocessorDirective(var condition, var ifBlock, var elseBlock):
                    writer.Line($"#if {condition}");
                    writer.AppendRaw("\t\t\t\t");
                    writer.WriteMethodBodyStatement(ifBlock);
                    if (elseBlock is not null)
                    {
                        writer.LineRaw("#else");
                        writer.WriteMethodBodyStatement(elseBlock);
                    }

                    writer.LineRaw("#endif");
                    break;
                case ForeachStatement foreachStatement:
                    using (writer.AmbientScope())
                    {
                        writer.AppendRawIf("await ", foreachStatement.IsAsync);
                        writer.AppendRaw("foreach (");
                        if (foreachStatement.ItemType == null)
                            writer.AppendRaw("var ");
                        else
                            writer.Append($"{foreachStatement.ItemType} ");
                        writer.Append($"{foreachStatement.Item:D} in ");
                        writer.WriteValueExpression(foreachStatement.Enumerable);
                        //writer.AppendRawIf(".ConfigureAwait(false)", foreachStatement.IsAsync);
                        writer.LineRaw(")");
                        writer.LineRaw("{");
                        WriteMethodBodyStatement(writer, foreachStatement.Body.AsStatement());
                        writer.LineRaw("}");
                    }
                    break;
                case ForStatement forStatement:
                    using (writer.AmbientScope())
                    {
                        writer.AppendRaw("for (");
                        writer.WriteValueExpression(
                            new AssignmentExpression(
                                forStatement.IndexerVariable,
                                new ConstantExpression(new Constant(0, typeof(int)))));
                        writer.AppendRaw("; ");
                        writer.WriteValueExpression(
                            new BoolExpression(
                                new BinaryOperatorExpression(
                                    "<",
                                    forStatement.IndexerVariable,
                                    forStatement.Enumerable.Property("Length"))));
                        writer.AppendRaw("; ");
                        writer.WriteValueExpression(new UnaryOperatorExpression("++", forStatement.IndexerVariable, true));
                        writer.LineRaw(")");
                        writer.LineRaw("{");
                        writer.LineRaw("");
                        WriteMethodBodyStatement(writer, forStatement.Body.AsStatement());
                        writer.LineRaw("}");
                    }
                    break;
                case UsingScopeStatement usingStatement:
                    using (writer.AmbientScope())
                    {
                        writer.AppendRaw("using (");
                        if (usingStatement.Type == null)
                            writer.AppendRaw("var ");
                        else
                            writer.Append($"{usingStatement.Type} ");
                        writer.Append($"{usingStatement.Variable:D} = ");
                        writer.WriteValueExpression(usingStatement.Value);
                        writer.LineRaw(")");
                        writer.LineRaw("{");
                        WriteMethodBodyStatement(writer, usingStatement.Body.AsStatement());
                        writer.LineRaw("}");
                    }
                    break;
                case DeclarationStatement line:
                    writer.WriteDeclaration(line);
                    break;

                case SwitchStatement switchStatement:
                    using (writer.AmbientScope())
                    {
                        writer.Append($"switch (");
                        writer.WriteValueExpression(switchStatement.MatchExpression);
                        writer.LineRaw(")");
                        writer.LineRaw("{");
                        foreach (var switchCase in switchStatement.Cases)
                        {
                            if (switchCase.Match.Any())
                            {
                                for (var i = 0; i < switchCase.Match.Count; i++)
                                {
                                    ValueExpression? match = switchCase.Match[i];
                                    writer.AppendRaw("case ");
                                    writer.WriteValueExpression(match);
                                    if (i < switchCase.Match.Count - 1)
                                    {
                                        writer.LineRaw(":");
                                    }
                                }
                            }
                            else
                            {
                                writer.AppendRaw("default");
                            }

                            writer.AppendRaw(": ");
                            if (!switchCase.Inline)
                            {
                                writer.Line();
                            }

                            if (switchCase.AddScope)
                            {
                                using (writer.Scope())
                                {
                                    writer.WriteMethodBodyStatement(switchCase.Statement);
                                }
                            }
                            else
                            {
                                writer.WriteMethodBodyStatement(switchCase.Statement);
                            }
                        }
                        writer.LineRaw("}");
                    }
                    break;

                case KeywordStatement(var keyword, var expression):
                    writer.AppendRaw(keyword);
                    if (expression is not null)
                    {
                        writer.AppendRaw(" ").WriteValueExpression(expression);
                    }
                    writer.LineRaw(";");
                    break;

                case EmptyLineStatement:
                    writer.Line();
                    break;

                case ThrowStatement throwStatement:
                    writer.WriteValueExpression(throwStatement.ThrowExpression);
                    writer.LineRaw(";");
                    break;

                case MethodBodyStatements(var statements):
                    foreach (var statement in statements)
                    {
                        writer.WriteMethodBodyStatement(statement);
                    }

                    break;
            }
        }

        private static void WriteDeclaration(this CodeWriter writer, DeclarationStatement declaration)
        {
            switch (declaration)
            {
                case AssignValueIfNullStatement setValue:
                    writer.WriteValueExpression(setValue.To);
                    writer.AppendRaw(" ??= ");
                    writer.WriteValueExpression(setValue.From);
                    writer.LineRaw(";");
                    break;
                case AssignValueStatement setValue:
                    writer.WriteValueExpression(setValue.To);
                    writer.AppendRaw(" = ");
                    writer.WriteValueExpression(setValue.From);
                    writer.LineRaw(";");
                    break;
                case DeclareVariableStatement { Type: { } type } declareVariable:
                    writer.Append($"{type} {declareVariable.Name:D} = ");
                    writer.WriteValueExpression(declareVariable.Value);
                    writer.LineRaw(";");
                    break;
                case DeclareVariableStatement declareVariable:
                    writer.Append($"var {declareVariable.Name:D} = ");
                    writer.WriteValueExpression(declareVariable.Value);
                    writer.LineRaw(";");
                    break;
                case UsingDeclareVariableStatement { Type: { } type } declareVariable:
                    writer.Append($"using {type} {declareVariable.Name:D} = ");
                    writer.WriteValueExpression(declareVariable.Value);
                    writer.LineRaw(";");
                    break;
                case UsingDeclareVariableStatement declareVariable:
                    writer.Append($"using var {declareVariable.Name:D} = ");
                    writer.WriteValueExpression(declareVariable.Value);
                    writer.LineRaw(";");
                    break;
                case DeclareLocalFunctionStatement localFunction:
                    writer.Append($"{localFunction.ReturnType} {localFunction.Name:D}(");
                    foreach (var parameter in localFunction.Parameters)
                    {
                        writer.Append($"{parameter.Type} {parameter.Name}, ");
                    }

                    writer.RemoveTrailingComma();
                    writer.AppendRaw(")");
                    if (localFunction.BodyExpression is not null)
                    {
                        writer.AppendRaw(" => ");
                        writer.WriteValueExpression(localFunction.BodyExpression);
                        writer.LineRaw(";");
                    }
                    else
                    {
                        using (writer.Scope())
                        {
                            writer.WriteMethodBodyStatement(localFunction.BodyStatement!);
                        }
                    }
                    break;
                case UnaryOperatorStatement unaryOperatorStatement:
                    writer.WriteValueExpression(unaryOperatorStatement.Expression);
                    writer.LineRaw(";");
                    break;
            }
        }

        public static void WriteValueExpression(this CodeWriter writer, ValueExpression expression)
        {
            switch (expression)
            {
                case CastExpression cast:
                    // wrap the cast expression with parenthesis, so that it would not cause ambiguity for leading recursive calls
                    // if the parenthesis are not needed, the roslyn reducer will remove it.
                    writer.AppendRaw("(");
                    writer.Append($"({cast.Type})");
                    writer.WriteValueExpression(cast.Inner);
                    writer.AppendRaw(")");
                    break;
                case CollectionInitializerExpression(var items):
                    writer.AppendRaw("{ ");
                    foreach (var item in items)
                    {
                        writer.WriteValueExpression(item);
                        writer.AppendRaw(",");
                    }

                    writer.RemoveTrailingComma();
                    writer.AppendRaw(" }");
                    break;
                case MemberExpression(var inner, var memberName):
                    if (inner is not null)
                    {
                        writer.WriteValueExpression(inner);
                        writer.AppendRaw(".");
                    }
                    writer.AppendRaw(memberName);
                    break;
                case IndexerExpression(var inner, var indexer):
                    if (inner is not null)
                    {
                        writer.WriteValueExpression(inner);
                    }
                    writer.AppendRaw("[");
                    writer.WriteValueExpression(indexer);
                    writer.AppendRaw("]");
                    break;
                case InvokeStaticMethodExpression { CallAsExtension: true } methodCall:
                    writer.AppendRawIf("await ", methodCall.CallAsAsync);
                    if (methodCall.MethodType != null)
                    {
                        writer.UseNamespace(methodCall.MethodType.Namespace);
                    }

                    writer.WriteValueExpression(methodCall.Arguments[0]);
                    writer.AppendRaw(".");
                    writer.AppendRaw(methodCall.MethodName);
                    WriteTypeArguments(writer, methodCall.TypeArguments);
                    WriteArguments(writer, methodCall.Arguments.Skip(1));
                    writer.AppendRawIf(".ConfigureAwait(false)", methodCall.CallAsAsync);
                    break;
                case InvokeStaticMethodExpression { CallAsExtension: false } methodCall:
                    writer.AppendRawIf("await ", methodCall.CallAsAsync);
                    if (methodCall.MethodType != null)
                    {
                        writer.Append($"{methodCall.MethodType}.");
                    }

                    writer.AppendRaw(methodCall.MethodName);
                    WriteTypeArguments(writer, methodCall.TypeArguments);
                    WriteArguments(writer, methodCall.Arguments);
                    writer.AppendRawIf(".ConfigureAwait(false)", methodCall.CallAsAsync);
                    break;
                case InvokeInstanceMethodExpression methodCall:
                    writer.AppendRawIf("await ", methodCall.CallAsAsync);
                    if (methodCall.InstanceReference != null)
                    {
                        writer.WriteValueExpression(methodCall.InstanceReference);
                        writer.AppendRaw(".");
                    }

                    writer.AppendRaw(methodCall.MethodName);
                    WriteTypeArguments(writer, methodCall.TypeArguments);
                    WriteArguments(writer, methodCall.Arguments);
                    writer.AppendRawIf(".ConfigureAwait(false)", methodCall.CallAsAsync && methodCall.AddConfigureAwaitFalse);
                    break;
                case FuncExpression { Parameters: var parameters, Inner: var inner }:
                    using (writer.AmbientScope())
                    {
                        if (parameters.Count == 1)
                        {
                            var parameter = parameters[0];
                            if (parameter is not null)
                            {
                                writer.Declaration(parameter);
                            }
                            else
                            {
                                writer.AppendRaw("_");
                            }
                        }
                        else
                        {
                            writer.AppendRaw("(");
                            foreach (var parameter in parameters)
                            {
                                if (parameter is not null)
                                {
                                    writer.Declaration(parameter);
                                }
                                else
                                {
                                    writer.AppendRaw("_");
                                }
                                writer.AppendRaw(", ");
                            }

                            writer.RemoveTrailingComma();
                            writer.AppendRaw(")");
                        }

                        writer.AppendRaw(" => ");
                        writer.WriteValueExpression(inner);
                    }

                    break;

                case SwitchExpression(var matchExpression, var cases):
                    using (writer.AmbientScope())
                    {
                        writer.WriteValueExpression(matchExpression);
                        writer.LineRaw(" switch");
                        writer.LineRaw("{");
                        foreach (var switchCase in cases)
                        {
                            writer.WriteValueExpression(switchCase.Case);
                            writer.AppendRaw(" => ");
                            writer.WriteValueExpression(switchCase.Expression);
                            writer.LineRaw(",");
                        }
                        writer.RemoveTrailingComma();
                        writer.Line();
                        writer.AppendRaw("}");
                    }

                    break;

                case DictionaryInitializerExpression(var values):
                    if (values is not { Count: > 0 })
                    {
                        writer.AppendRaw("{}");
                        break;
                    }

                    writer.Line();
                    writer.LineRaw("{");
                    foreach (var (key, value) in values)
                    {
                        writer.AppendRaw("[");
                        writer.WriteValueExpression(key);
                        writer.AppendRaw("] = ");
                        writer.WriteValueExpression(value);
                        writer.LineRaw(",");
                    }

                    writer.RemoveTrailingComma();
                    writer.Line();
                    writer.AppendRaw("}");
                    break;

                case ArrayInitializerExpression(var items, var isInline):
                    if (items is not { Count: > 0 })
                    {
                        writer.AppendRaw("{}");
                        break;
                    }

                    if (isInline)
                    {
                        writer.AppendRaw("{");
                        foreach (var item in items)
                        {
                            writer.WriteValueExpression(item);
                            writer.AppendRaw(", ");
                        }

                        writer.RemoveTrailingComma();
                        writer.AppendRaw("}");
                    }
                    else
                    {
                        writer.Line();
                        writer.LineRaw("{");
                        foreach (var item in items)
                        {
                            writer.WriteValueExpression(item);
                            writer.LineRaw(",");
                        }

                        writer.RemoveTrailingComma();
                        writer.Line();
                        writer.AppendRaw("}");
                    }
                    break;

                case ObjectInitializerExpression(var parameters, var useSingleLine):
                    if (parameters is not { Count: > 0 })
                    {
                        writer.AppendRaw("{}");
                        break;
                    }

                    if (useSingleLine)
                    {
                        writer.AppendRaw("{");
                        foreach (var (name, value) in parameters)
                        {
                            writer.Append($"{name} = ");
                            writer.WriteValueExpression(value);
                            writer.AppendRaw(", ");
                        }

                        writer.RemoveTrailingComma();
                        writer.AppendRaw("}");
                    }
                    else
                    {
                        writer.Line();
                        writer.LineRaw("{");
                        foreach (var (name, value) in parameters)
                        {
                            writer.Append($"{name} = ");
                            writer.WriteValueExpression(value);
                            writer.LineRaw(",");
                        }
                        // Commented to minimize changes in generated code
                        //writer.RemoveTrailingComma();
                        //writer.Line();
                        writer.AppendRaw("}");
                    }
                    break;

                case NewInstanceExpression(var type, var parameters, var initExpression):
                    writer.Append($"new {type}");
                    if (parameters.Count > 0 || initExpression is not { Parameters.Count: > 0 })
                    {
                        WriteArguments(writer, parameters, parameters.Count < SingleLineParameterThreshold);
                    }

                    if (initExpression is { Parameters.Count: > 0 })
                    {
                        writer.WriteValueExpression(initExpression);
                    }
                    break;

                case NewDictionaryExpression(var type, var values):
                    writer.Append($"new {type}");
                    if (values is { Values.Count: > 0 })
                    {
                        writer.WriteValueExpression(values);
                    }
                    else
                    {
                        writer.AppendRaw("()");
                    }
                    break;

                case NewArrayExpression(var type, var items, var size):
                    if (size is not null)
                    {
                        writer.Append($"new {type?.FrameworkType}");
                        writer.AppendRaw("[");
                        writer.WriteValueExpression(size);
                        writer.AppendRaw("]");
                        break;
                    }

                    if (items is { Elements.Count: > 0 })
                    {
                        if (type is null)
                        {
                            writer.AppendRaw("new[]");
                        }
                        else
                        {
                            writer.Append($"new {type}[]");
                        }

                        writer.WriteValueExpression(items);
                    }
                    else if (type is null)
                    {
                        writer.AppendRaw("new[]{}");
                    }
                    else
                    {
                        writer.Append($"Array.Empty<{type}>()");
                    }
                    break;

                case NewJsonSerializerOptionsExpression:
                    writer.UseNamespace("Azure.ResourceManager.Models");
                    writer.Append($"new {typeof(JsonSerializerOptions)} {{ Converters = {{ new {nameof(ManagedServiceIdentityTypeV3Converter)}() }} }}");
                    break;

                case NullConditionalExpression nullConditional:
                    writer.WriteValueExpression(nullConditional.Inner);
                    writer.AppendRaw("?");
                    break;
                case UnaryOperatorExpression(var op, var operand, var operandOnTheLeft):
                    writer.AppendRawIf(op, !operandOnTheLeft);
                    writer.WriteValueExpression(operand);
                    writer.AppendRawIf(op, operandOnTheLeft);
                    break;
                case BinaryOperatorExpression(var op, var left, var right):
                    // we should always write parenthesis around this expression since some or the logic operator has lower priority, and we might get trouble when there is a chain of binary operator expression, for instance (a || b) && c.
                    writer.AppendRaw("(");
                    writer.WriteValueExpression(left);
                    writer.AppendRaw(" ").AppendRaw(op).AppendRaw(" ");
                    writer.WriteValueExpression(right);
                    writer.AppendRaw(")");
                    break;
                case TernaryConditionalOperator ternary:
                    writer.WriteValueExpression(ternary.Condition);
                    writer.AppendRaw(" ? ");
                    writer.WriteValueExpression(ternary.Consequent);
                    writer.AppendRaw(" : ");
                    writer.WriteValueExpression(ternary.Alternative);
                    break;
                case PositionalParameterReference(var parameterName, var value):
                    writer.Append($"{parameterName}: ");
                    writer.WriteValueExpression(value);
                    break;
                case ParameterReference(var parameter):
                    writer.AppendRawIf("ref ", parameter.IsRef);
                    writer.Append($"{parameter.Name:I}");
                    break;
                case FormattableStringToExpression formattableString:
                    writer.Append(formattableString.Value);
                    break;
                case TypeReference typeReference:
                    writer.Append($"{typeReference.Type}");
                    break;
                case VariableReference variable:
                    writer.Append($"{variable.Declaration:I}");
                    break;
                case TypedValueExpression typed:
                    writer.WriteValueExpression(typed.Untyped);
                    break;
                case KeywordExpression(var keyword, var inner):
                    writer.AppendRaw(keyword);
                    if (inner is not null)
                    {
                        writer.AppendRaw(" ").WriteValueExpression(inner);
                    }
                    break;
                case StringLiteralExpression(var literal, true):
                    writer.Literal(literal).AppendRaw("u8");
                    break;
                case StringLiteralExpression(var literal, false):
                    writer.Literal(literal);
                    break;
                case FormattableStringExpression(var format, var args):
                    writer.AppendRaw("$\"");
                    var argumentCount = 0;
                    foreach ((var span, bool isLiteral) in StringExtensions.GetPathParts(format))
                    {
                        if (isLiteral)
                        {
                            writer.AppendRaw(span.ToString());
                            continue;
                        }

                        var arg = args[argumentCount];
                        argumentCount++;
                        // append the argument
                        writer.AppendRaw("{");
                        writer.WriteValueExpression(arg);
                        writer.AppendRaw("}");
                    }
                    writer.AppendRaw("\"");
                    break;
                case ArrayElementExpression(var array, var index):
                    writer.WriteValueExpression(array);
                    writer.AppendRaw("[");
                    writer.WriteValueExpression(index);
                    writer.AppendRaw("]");
                    break;
                case DeclarationExpression(var variable, var isOut):
                    writer.AppendRawIf("out ", isOut);
                    writer.Append($"{variable.Type} {variable.Declaration:D}");
                    break;
                case AssignmentExpression(var variable, var value):
                    writer.Append($"{variable.Type} {variable.Declaration:D} = {value}");
                    break;
            }

            static void WriteArguments(CodeWriter writer, IEnumerable<ValueExpression> arguments, bool useSingleLine = true)
            {
                if (useSingleLine)
                {
                    writer.AppendRaw("(");
                    foreach (var argument in arguments)
                    {
                        writer.WriteValueExpression(argument);
                        writer.AppendRaw(", ");
                    }

                    writer.RemoveTrailingComma();
                    writer.AppendRaw(")");
                }
                else
                {
                    writer.LineRaw("(");
                    foreach (var argument in arguments)
                    {
                        writer.AppendRaw("\t");
                        writer.WriteValueExpression(argument);
                        writer.LineRaw(",");
                    }

                    writer.RemoveTrailingCharacter();
                    writer.RemoveTrailingComma();
                    writer.AppendRaw(")");
                }
            }

            static void WriteTypeArguments(CodeWriter writer, IEnumerable<CSharpType>? typeArguments)
            {
                if (typeArguments is null)
                {
                    return;
                }

                writer.AppendRaw("<");
                foreach (var argument in typeArguments)
                {
                    writer.Append($"{argument}, ");
                }

                writer.RemoveTrailingComma();
                writer.AppendRaw(">");
            }
        }
    }
}
