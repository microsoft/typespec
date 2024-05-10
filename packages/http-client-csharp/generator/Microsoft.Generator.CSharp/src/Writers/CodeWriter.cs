// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Buffers;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.CodeAnalysis.CSharp;
using System.Linq;
using System.Text;
using System.Runtime.CompilerServices;
using static Microsoft.Generator.CSharp.ValidationType;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.CodeAnalysis;
using static Microsoft.Generator.CSharp.Expressions.Snippets;
using Microsoft.Generator.CSharp.Models;

namespace Microsoft.Generator.CSharp
{
    public sealed class CodeWriter
    {
        private const int DefaultLength = 1024;
        private static readonly string _newLine = "\n";
        private static readonly string _braceNewLine = "{\n";

        private readonly HashSet<string> _usingNamespaces = new HashSet<string>();

        private readonly Stack<CodeWriterScope> _scopes;
        private string? _currentNamespace;
        private char[] _builder;
        private int _length;
        private bool _writingXmlDocumentation;

        internal CodeWriter()
        {
            _builder = ArrayPool<char>.Shared.Rent(DefaultLength);

            _scopes = new Stack<CodeWriterScope>();
            _scopes.Push(new CodeWriterScope(this, "", false));
        }

        public CodeWriterScope Scope(FormattableString line, string start = "{", string end = "}", bool newLine = true, CodeWriterScopeDeclarations? scopeDeclarations = null)
        {
            ValidateDeclarations(scopeDeclarations);
            CodeWriterScope codeWriterScope = new CodeWriterScope(this, end, newLine);
            _scopes.Push(codeWriterScope);
            WriteLine(line);
            WriteRawLine(start);
            AddDeclarationsToScope(scopeDeclarations);
            return codeWriterScope;
        }

        public CodeWriterScope Scope()
        {
            return ScopeRaw();
        }

        private void ValidateDeclarations(CodeWriterScopeDeclarations? scopeDeclarations)
        {
            if (scopeDeclarations == null)
            {
                return;
            }

            foreach (var declarationName in scopeDeclarations.Names)
            {
                if (!IsAvailable(declarationName))
                {
                    throw new InvalidOperationException($"Variable with name '{declarationName}' is declared already.");
                }
            }
        }

        private void AddDeclarationsToScope(CodeWriterScopeDeclarations? scopeDeclarations)
        {
            if (scopeDeclarations == null)
            {
                return;
            }

            var currentScope = _scopes.Peek();

            foreach (var declarationName in scopeDeclarations.Names)
            {
                foreach (var scope in _scopes)
                {
                    scope.AllDefinedIdentifiers.Add(declarationName);
                }

                currentScope.Identifiers.Add(declarationName);
            }
        }

        private CodeWriterScope ScopeRaw(string start = "{", string end = "}", bool newLine = true)
        {
            WriteRawLine(start);
            CodeWriterScope codeWriterScope = new CodeWriterScope(this, end, newLine);
            _scopes.Push(codeWriterScope);
            return codeWriterScope;
        }

        private static void AppendTypeWithShortNames(CSharpType type, StringBuilder sb)
        {
            sb.Append(type.TryGetCSharpFriendlyName(out var keywordName) ? keywordName : type.Name);

            if (type.Arguments.Any())
            {
                sb.Append("{");
                foreach (var typeArgument in type.Arguments)
                {
                    AppendTypeWithShortNames(typeArgument, sb);
                    sb.Append(",");
                }
                sb.Remove(sb.Length - 1, 1);
                sb.Append("}");
            }

            if (type is { IsNullable: true, IsValueType: true })
            {
                sb.Append("?");
            }
        }

        private CodeWriter WriteXmlDocumentationParametersExceptions(Type exceptionType, IReadOnlyCollection<Parameter> parameters, string reason)
        {
            if (parameters.Count == 0)
            {
                return this;
            }

            var formatBuilder = new StringBuilder();
            for (var i = 0; i < parameters.Count - 2; ++i)
            {
                formatBuilder.Append("<paramref name=\"{").Append(i).Append("}\"/>, ");
            }

            if (parameters.Count > 1)
            {
                formatBuilder.Append("<paramref name=\"{").Append(parameters.Count - 2).Append("}\"/> or ");
            }

            formatBuilder.Append("<paramref name=\"{").Append(parameters.Count - 1).Append("}\"/>");
            formatBuilder.Append(reason);

            var description = FormattableStringFactory.Create(formatBuilder.ToString(), parameters.Select(p => (object)p.Name).ToArray());
            return WriteXmlDocumentationException(exceptionType, description);
        }

        public CodeWriterScope SetNamespace(string @namespace)
        {
            _currentNamespace = @namespace;
            WriteLine($"namespace {@namespace}");
            return Scope();
        }

        public CodeWriter Append(FormattableString formattableString)
        {
            if (formattableString.ArgumentCount == 0)
            {
                return AppendRaw(formattableString.ToString());
            }

            const string literalFormatString = ":L";
            const string declarationFormatString = ":D"; // :D :)
            const string identifierFormatString = ":I";
            const string crefFormatString = ":C"; // wraps content into "see cref" tag, available only in xmlDoc
            foreach ((var span, bool isLiteral, int index) in StringExtensions.GetPathParts(formattableString.Format))
            {
                if (isLiteral)
                {
                    AppendRaw(span);
                    continue;
                }

                var argument = formattableString.GetArgument(index);
                var isDeclaration = span.EndsWith(declarationFormatString);
                var isIdentifier = span.EndsWith(identifierFormatString);
                var isLiteralFormat = span.EndsWith(literalFormatString);
                var isCref = span.EndsWith(crefFormatString);

                if (isCref)
                {
                    if (!_writingXmlDocumentation)
                    {
                        throw new InvalidOperationException($"':C' formatter can be used only inside XmlDoc");
                    }

                    switch (argument)
                    {
                        case Type t:
                            AppendTypeForCRef(new CSharpType(t));
                            break;
                        case CSharpType t:
                            AppendTypeForCRef(t);
                            break;
                        default:
                            Append($"<see cref=\"{argument}\"/>");
                            break;
                    }

                    continue;
                }

                switch (argument)
                {
                    case IEnumerable<FormattableString> fss:
                        foreach (var fs in fss)
                        {
                            Append(fs);
                        }
                        break;
                    case FormattableString fs:
                        Append(fs);
                        break;
                    case Type t:
                        AppendType(new CSharpType(t), false, false);
                        break;
                    case CSharpType t:
                        AppendType(t, isDeclaration, false);
                        break;
                    case CodeWriterDeclaration declaration when isDeclaration:
                        WriteDeclaration(declaration);
                        break;
                    case CodeWriterDeclaration declaration:
                        Append(declaration);
                        break;
                    case ValueExpression expression:
                        expression.Write(this);
                        break;
                    case var _ when isLiteralFormat:
                        WriteLiteral(argument);
                        break;
                    default:
                        string? s = argument?.ToString();
                        if (s == null)
                        {
                            throw new ArgumentNullException(index.ToString());
                        }

                        if (isDeclaration)
                        {
                            WriteDeclaration(s);
                        }
                        else if (isIdentifier)
                        {
                            WriteIdentifier(s);
                        }
                        else
                        {
                            AppendRaw(s);
                        }
                        break;
                }
            }

            return this;
        }

        /// <summary>
        /// A wrapper around <see cref="CodeWriterExtensionMethods.WriteMethod(CodeWriter, CSharpMethod)"/> to allow for writing method body statements.
        /// This method will call the extension method <see cref="CodeWriterExtensionMethods.WriteMethod(CodeWriter, CSharpMethod)"/> of the plugin <see cref="CodeModelPlugin"/> with the current instance of <see cref="CodeWriter"/>
        /// and attempt to write <paramref name="method"/>.
        /// </summary>
        /// <param name="method">The <see cref="CSharpMethod"/> to write.</param>
        public void WriteMethod(CSharpMethod method)
        {
            CodeModelPlugin.Instance.CodeWriterExtensionMethods.WriteMethod(this, method);
        }

        public void WriteProperty(PropertyDeclaration property)
        {
            if (!CurrentLine.IsEmpty)
            {
                WriteLine();
            }

            if (property.Description is not null)
            {
                WriteXmlDocumentationSummary(property.Description);
            }

            // TODO -- should write parameter xml doc if this is an IndexerDeclaration: https://github.com/microsoft/typespec/issues/3276

            if (property.Exceptions is not null)
            {
                foreach (var (exceptionType, description) in property.Exceptions)
                {
                    WriteXmlDocumentationException(exceptionType, description);
                }
            }

            var modifiers = property.Modifiers;
            AppendRawIf("public ", modifiers.HasFlag(MethodSignatureModifiers.Public))
                .AppendRawIf("protected ", modifiers.HasFlag(MethodSignatureModifiers.Protected))
                .AppendRawIf("internal ", modifiers.HasFlag(MethodSignatureModifiers.Internal))
                .AppendRawIf("private ", modifiers.HasFlag(MethodSignatureModifiers.Private))
                .AppendRawIf("override ", modifiers.HasFlag(MethodSignatureModifiers.Override))
                .AppendRawIf("static ", modifiers.HasFlag(MethodSignatureModifiers.Static))
                .AppendRawIf("virtual ", modifiers.HasFlag(MethodSignatureModifiers.Virtual));

            Append($"{property.PropertyType} ");

            if (property.ExplicitInterface is not null)
            {
                Append($"{property.ExplicitInterface}.");
            }
            if (property is IndexerDeclaration indexer)
            {
                Append($"{indexer.Name}[{indexer.IndexerParameter.Type} {indexer.IndexerParameter.Name}]");
            }
            else
            {
                Append($"{property.Name:I}");
            }

            switch (property.PropertyBody)
            {
                case ExpressionPropertyBody(var expression):
                    expression.Write(AppendRaw(" => "));
                    AppendRaw(";");
                    break;
                case AutoPropertyBody(var hasSetter, var setterModifiers, var initialization):
                    AppendRaw("{ get;");
                    if (hasSetter)
                    {
                        WritePropertyAccessorModifiers(setterModifiers);
                        AppendRaw("set;");
                    }
                    AppendRaw(" }");
                    if (initialization is not null)
                    {
                        initialization.Write(AppendRaw(" = "));
                        AppendRaw(";");
                    }
                    break;
                case MethodPropertyBody(var getter, var setter, var setterModifiers):
                    WriteLine();
                    WriteRawLine("{");
                    // write getter
                    WriteMethodPropertyAccessor("get", getter);
                    // write setter
                    if (setter is not null)
                    {
                        WriteMethodPropertyAccessor("set", setter, setterModifiers);
                    }
                    AppendRaw("}");
                    break;
                default:
                    throw new InvalidOperationException($"Unhandled property body type {property.PropertyBody}");
            }

            WriteLine();

            void WriteMethodPropertyAccessor(string name, MethodBodyStatement body, MethodSignatureModifiers modifiers = MethodSignatureModifiers.None)
            {
                WritePropertyAccessorModifiers(modifiers);
                WriteRawLine(name);
                WriteRawLine("{");
                using (AmbientScope())
                {
                    body.Write(this);
                }
                WriteRawLine("}");
            }

            void WritePropertyAccessorModifiers(MethodSignatureModifiers modifiers)
            {
                AppendRawIf("protected ", modifiers.HasFlag(MethodSignatureModifiers.Protected))
                    .AppendRawIf("internal ", modifiers.HasFlag(MethodSignatureModifiers.Internal))
                    .AppendRawIf("private ", modifiers.HasFlag(MethodSignatureModifiers.Private));
            }
        }

        public void UseNamespace(string @namespace)
        {
            if (_currentNamespace == @namespace)
            {
                return;
            }

            _usingNamespaces.Add(@namespace);
        }

        public CodeWriter AppendIf(FormattableString formattableString, bool condition)
        {
            if (condition)
            {
                Append(formattableString);
            }

            return this;
        }

        public CodeWriter AppendRawIf(string str, bool condition)
        {
            if (condition)
            {
                AppendRaw(str);
            }

            return this;
        }

        public void WriteParameter(Parameter clientParameter)
        {
            if (clientParameter.Attributes.Any())
            {
                AppendRaw("[");
                foreach (var attribute in clientParameter.Attributes)
                {
                    Append($"{attribute.Type}, ");
                }
                RemoveTrailingComma();
                AppendRaw("]");
            }

            AppendRawIf("out ", clientParameter.IsOut);
            AppendRawIf("ref ", clientParameter.IsRef);

            Append($"{clientParameter.Type} {clientParameter.Name:D}");
            if (clientParameter.DefaultValue != null)
            {
                AppendRaw(" = ");
                clientParameter.DefaultValue.Write(this);
            }

            AppendRaw(",");
        }

        public CodeWriter WriteField(FieldDeclaration field)
        {
            if (!CurrentLine.IsEmpty)
            {
                WriteLine();
            }

            if (field.Description != null)
            {
                WriteXmlDocumentationSummary(field.Description);
            }

            var modifiers = field.Modifiers;

            AppendRaw(modifiers.HasFlag(FieldModifiers.Public) ? "public " : (modifiers.HasFlag(FieldModifiers.Internal) ? "internal " : "private "))
                .AppendRawIf("const ", modifiers.HasFlag(FieldModifiers.Const))
                .AppendRawIf("static ", modifiers.HasFlag(FieldModifiers.Static))
                .AppendRawIf("readonly ", modifiers.HasFlag(FieldModifiers.ReadOnly));

            Append($"{field.Type} {field.Name:I}");

            if (field.InitializationValue != null &&
                (modifiers.HasFlag(FieldModifiers.Const) || modifiers.HasFlag(FieldModifiers.Static)))
            {
                AppendRaw(" = ");
                field.InitializationValue.Write(this);
            }

            return WriteLine($";");
        }

        public CodeWriter WriteParameterNullChecks(IReadOnlyCollection<Parameter> parameters)
        {
            foreach (Parameter parameter in parameters)
            {
                WriteVariableAssignmentWithNullCheck(parameter.Name, parameter);
            }

            WriteLine();
            return this;
        }

        public void WriteVariableAssignmentWithNullCheck(string variableName, Parameter parameter)
        {
            var assignToSelf = parameter.Name == variableName;
            if (parameter.Initializer != null)
            {
                if (assignToSelf)
                {
                    WriteLine($"{variableName:I} ??= {parameter.Initializer};");
                }
                else
                {
                    WriteLine($"{variableName:I} = {parameter.Name:I} ?? {parameter.Initializer};");
                }
            }
            else if (parameter.Validation != ValidationType.None)
            {
                if (assignToSelf)
                {
                    using (Scope($"if ({parameter.Name:I} == null)"))
                    {
                        WriteLine($"throw new {typeof(ArgumentNullException)}(nameof({parameter.Name:I}));");
                    }
                }
                else
                {
                    WriteLine($"{variableName:I} = {parameter.Name:I} ?? throw new {typeof(ArgumentNullException)}(nameof({parameter.Name:I}));");
                }
            }
            else if (!assignToSelf)
            {
                WriteLine($"{variableName:I} = {parameter.Name:I};");
            }
        }

        public CodeWriter WriteParametersValidation(IEnumerable<Parameter> parameters)
        {
            foreach (Parameter parameter in parameters)
            {
                WriteParameterValidation(parameter);
            }

            WriteLine();
            return this;
        }

        private CodeWriter WriteParameterValidation(Parameter parameter)
        {
            if (parameter.Validation == None && parameter.Initializer != null)
            {
                return WriteLine($"{parameter.Name:I} ??= {parameter.Initializer};");
            }

            var validationStatement = Argument.ValidateParameter(parameter);

            validationStatement.Write(this);

            return this;
        }

        public CodeWriter WriteXmlDocumentationInheritDoc(CSharpType? crefType = null)
            => crefType == null
                ? WriteLine($"/// <inheritdoc />")
                : WriteLine($"/// <inheritdoc cref=\"{crefType}\"/>");

        public CodeWriter WriteXmlDocumentationSummary(FormattableString? text)
        {
            return WriteXmlDocumentation("summary", text);
        }

        public CodeWriter WriteXmlDocumentation(string tag, FormattableString? text)
        {
            return WriteDocumentationLines($"<{tag}>", $"</{tag}>", text);
        }

        public CodeWriter WriteXmlDocumentationParameters(IEnumerable<Parameter> parameters)
        {
            foreach (var parameter in parameters)
            {
                WriteXmlDocumentationParameter(parameter);
            }

            return this;
        }

        public CodeWriter WriteXmlDocumentationParameter(string name, FormattableString? text)
        {
            return WriteDocumentationLines($"<param name=\"{name}\">", $"</param>", text);
        }

        /// <summary>
        /// Writes XML documentation for a parameter of a method using a "param" tag.
        /// </summary>
        /// <param name="writer">Writer to which code is written to.</param>
        /// <param name="parameter">The definition of the parameter, including name and description.</param>
        /// <returns></returns>
        public CodeWriter WriteXmlDocumentationParameter(Parameter parameter)
        {
            return WriteXmlDocumentationParameter(parameter.Name, parameter.Description);
        }

        public CodeWriter WriteXmlDocumentationException(CSharpType exception, FormattableString? description)
        {
            return WriteDocumentationLines($"<exception cref=\"{exception}\">", $"</exception>", description);
        }

        public CodeWriter WriteXmlDocumentationReturns(FormattableString text)
        {
            return WriteDocumentationLines($"<returns>", $"</returns>", text);
        }

        internal CodeWriter WriteXmlDocumentationInclude(string filename, MethodSignature methodSignature, out string memberId)
        {
            var sb = new StringBuilder();
            sb.Append(methodSignature.Name).Append("(");
            foreach (var parameter in methodSignature.Parameters)
            {
                AppendTypeWithShortNames(parameter.Type, sb);
                sb.Append(",");
            }

            sb.Remove(sb.Length - 1, 1);
            sb.Append(")");

            memberId = sb.ToString();
            return WriteRawLine($"/// <include file=\"{filename}\" path=\"doc/members/member[@name='{memberId}']/*\" />");
        }

        public CodeWriter WriteXmlDocumentationRequiredParametersException(IEnumerable<Parameter> parameters)
        {
            return WriteXmlDocumentationParametersExceptions(typeof(ArgumentNullException), parameters.Where(p => p.Validation is AssertNotNull or AssertNotNullOrEmpty).ToArray(), " is null.");
        }

        public CodeWriter WriteXmlDocumentationNonEmptyParametersException(IEnumerable<Parameter> parameters)
        {
            return WriteXmlDocumentationParametersExceptions(typeof(ArgumentException), parameters.Where(p => p.Validation == AssertNotNullOrEmpty).ToArray(), " is an empty string, and was expected to be non-empty.");
        }

        public CodeWriter WriteDocumentationLines(FormattableString startTag, FormattableString endTag, FormattableString? text)
            => AppendXmlDocumentation(startTag, endTag, text ?? $"");

        internal CodeWriter WriteRawXmlDocumentation(FormattableString? content)
        {
            if (content is null)
                return this;

            var lines = content.ToString().Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            var xmlLines = string.Join('\n', lines.Select(l => "/// " + l));
            AppendRaw(xmlLines);
            WriteLine();
            return this;
        }

        internal CodeWriter AppendXmlDocumentation(FormattableString startTag, FormattableString endTag, FormattableString content)
        {
            const string xmlDoc = "/// ";
            const string xmlDocNewLine = "\n/// ";

            var commentStart = _length;
            AppendRaw(CurrentLine.IsEmpty ? xmlDoc : xmlDocNewLine);

            var startTagStart = _length;
            Append(startTag);
            _writingXmlDocumentation = true;

            var contentStart = _length;
            if (content.Format.Length > 0)
            {
                Append(content);
            }
            var contentEnd = _length;

            _writingXmlDocumentation = false;
            Append(endTag);

            if (contentStart == contentEnd)
            {
                var startTagSpan = WrittenText.Slice(startTagStart + 1, contentStart - startTagStart - 1);
                var endTagSpan = WrittenText.Slice(contentEnd + 2);

                if (startTagSpan.SequenceEqual(endTagSpan))
                {
                    // Remove empty tags
                    _length = commentStart;
                }
                else
                {
                    WriteLine();
                }

                return this;
            }

            WriteLine();
            var contentSpan = _builder.AsSpan(contentStart, contentEnd - contentStart);

            var lastLineBreak = contentSpan.LastIndexOf(_newLine);
            if (lastLineBreak == -1)
            {
                // Add spaces and dot to match existing formatting
                if (contentEnd > contentStart)
                {
                    if (contentSpan[^1] != ' ')
                    {
                        InsertRaw(contentSpan[^1] == '.' ? " " : ". ", contentEnd);
                    }
                    else
                    {
                        var trimmedContentSpan = contentSpan.TrimEnd();
                        if (trimmedContentSpan[^1] != '.')
                        {
                            InsertRaw(".", contentStart + trimmedContentSpan.Length);
                        }
                    }

                    if (contentSpan[0] != ' ')
                    {
                        InsertRaw(" ", contentStart);
                    }
                }
                return this;
            }

            if (lastLineBreak != contentSpan.Length)
            {
                InsertRaw(xmlDocNewLine, contentEnd);
            }

            while (lastLineBreak != -1)
            {
                InsertRaw(xmlDoc, lastLineBreak + contentStart + 1);
                contentSpan = contentSpan.Slice(0, lastLineBreak);
                lastLineBreak = contentSpan.LastIndexOf(_newLine);
            }

            if (contentSpan.Length > 0)
            {
                InsertRaw(xmlDocNewLine, contentStart);
            }

            return this;
        }

        internal string GetTemporaryVariable(string s)
        {
            if (IsAvailable(s))
            {
                return s;
            }

            for (int i = 0; i < 100; i++)
            {
                var name = s + i;
                if (IsAvailable(name))
                {
                    return name;
                }
            }
            throw new InvalidOperationException("Can't find suitable variable name.");
        }

        private bool IsAvailable(string s)
        {
            if (_scopes.TryPeek(out var currentScope))
            {
                if (currentScope.AllDefinedIdentifiers.Contains(s))
                {
                    return false;
                }
            }

            foreach (CodeWriterScope codeWriterScope in _scopes)
            {
                if (codeWriterScope.Identifiers.Contains(s))
                {
                    return false;
                }
            }

            return true;
        }

        private void AppendTypeForCRef(CSharpType type)
        {
            // Because of the limitations of type cref in XmlDoc
            // we add "?" nullability operator after `cref` block
            var isNullable = type is { IsNullable: true, IsValueType: true };
            var arguments = type.IsGenericType ? type.Arguments : null;

            type = type.WithNullable(false);
            if (type.IsGenericType)
            {
                type = type.GetGenericTypeDefinition();
            }

            AppendRaw($"<see cref=\"");
            AppendType(type, false, false);
            AppendRaw($"\"/>");

            if (isNullable)
            {
                AppendRaw("?");
            }

            if (arguments is not null)
            {
                for (int i = 0; i < arguments.Count; i++)
                {
                    var argument = arguments[i];
                    if (argument is { IsFrameworkType: true, FrameworkType.IsGenericParameter: true })
                    {
                        continue;
                    }

                    AppendRaw(" where <c>");
                    AppendType(type.Arguments[i], false, false);
                    AppendRaw("</c> is");
                    if (argument.IsArray)
                    {
                        AppendRaw(" an array of type ");
                        argument = argument.ElementType;
                    }
                    else
                    {
                        AppendRaw(" of type ");
                    }

                    // If argument type is non-generic, we can provide "see cref" for it
                    // Otherwise, just write its name
                    if (argument.IsGenericType)
                    {
                        AppendRaw("<c>");
                        AppendType(argument, false, true);
                        AppendRaw("</c>");
                    }
                    else
                    {
                        AppendTypeForCRef(argument);
                    }

                    AppendRaw(",");
                }
                RemoveTrailingComma();
            }
        }

        private void AppendType(CSharpType type, bool isDeclaration, bool writeTypeNameOnly)
        {
            if (type.TryGetCSharpFriendlyName(out var keywordName))
            {
                AppendRaw(keywordName);
            }
            else if (isDeclaration && !type.IsFrameworkType)
            {
                AppendRaw(type.Implementation.Name);
            }
            else if (writeTypeNameOnly)
            {
                AppendRaw(type.Name);
            }
            else
            {
                UseNamespace(type.Namespace);

                AppendRaw("global::");
                AppendRaw(type.Namespace);
                AppendRaw(".");
                AppendRaw(type.Name);
            }

            if (type.Arguments.Any())
            {
                AppendRaw(_writingXmlDocumentation ? "{" : "<");
                foreach (var typeArgument in type.Arguments)
                {
                    AppendType(typeArgument, false, writeTypeNameOnly);
                    AppendRaw(_writingXmlDocumentation ? "," : ", ");
                }
                RemoveTrailingComma();
                AppendRaw(_writingXmlDocumentation ? "}" : ">");
            }

            if (!isDeclaration && type is { IsNullable: true, IsValueType: true })
            {
                AppendRaw("?");
            }
        }

        public CodeWriter WriteLiteral(object? o)
        {
            return AppendRaw(o switch
            {
                null => "null",
                string s => SyntaxFactory.Literal(s).ToString(),
                int i => SyntaxFactory.Literal(i).ToString(),
                long l => SyntaxFactory.Literal(l).ToString(),
                decimal d => SyntaxFactory.Literal(d).ToString(),
                double d => SyntaxFactory.Literal(d).ToString(),
                float f => SyntaxFactory.Literal(f).ToString(),
                char c => SyntaxFactory.Literal(c).ToString(),
                bool b => b ? "true" : "false",
                BinaryData bd => bd.ToArray().Length == 0 ? "new byte[] { }" : SyntaxFactory.Literal(bd.ToString()).ToString(),
                _ => throw new NotImplementedException()
            });
        }

        public CodeWriter WriteLine(FormattableString formattableString)
        {
            Append(formattableString);
            WriteLine();

            return this;
        }

        public CodeWriter WriteLine()
        {
            WriteRawLine(string.Empty);

            return this;
        }

        private ReadOnlySpan<char> WrittenText => _builder.AsSpan(0, _length);

        private ReadOnlySpan<char> PreviousLine
        {
            get
            {
                var writtenText = WrittenText;

                var indexOfNewLine = writtenText.LastIndexOf(_newLine);
                if (indexOfNewLine == -1)
                {
                    return Span<char>.Empty;
                }

                var writtenTextBeforeLastLine = writtenText.Slice(0, indexOfNewLine);
                var indexOfPreviousNewLine = writtenTextBeforeLastLine.LastIndexOf(_newLine);
                if (indexOfPreviousNewLine == -1)
                {
                    return writtenText.Slice(0, indexOfNewLine + 1);
                }

                return writtenText.Slice(indexOfPreviousNewLine + 1, indexOfNewLine - indexOfPreviousNewLine);
            }
        }

        private ReadOnlySpan<char> CurrentLine
        {
            get
            {
                var writtenText = WrittenText;

                var indexOfNewLine = writtenText.LastIndexOf(_newLine);
                if (indexOfNewLine == -1)
                {
                    return writtenText;
                }

                return writtenText.Slice(indexOfNewLine + 1);
            }
        }

        private void EnsureSpace(int space)
        {
            if (_builder.Length - _length < space)
            {
                var newBuilder = ArrayPool<char>.Shared.Rent(Math.Max(_builder.Length + space, _builder.Length * 2));
                _builder.AsSpan().CopyTo(newBuilder);

                ArrayPool<char>.Shared.Return(_builder);
                _builder = newBuilder;
            }
        }

        public CodeWriter WriteRawLine(string str)
        {
            AppendRaw(str);

            var previousLine = PreviousLine;

            if (CurrentLine.IsEmpty &&
                (previousLine.SequenceEqual(_newLine) || previousLine.EndsWith(_braceNewLine)))
            {
                return this;
            }

            AppendRaw(_newLine);

            return this;
        }

        public CodeWriter AppendRaw(string str) => AppendRaw(str.AsSpan());

        private CodeWriter AppendRaw(ReadOnlySpan<char> span) => InsertRaw(span, _length);

        private CodeWriter InsertRaw(ReadOnlySpan<char> span, int position, bool skipNewLineCheck = false)
        {
            Debug.Assert(0 <= position);
            Debug.Assert(position <= _length);

            if (!skipNewLineCheck)
            {
                var newLineSpan = "\r\n".AsSpan();
                var newLineIndex = span.IndexOf(newLineSpan);
                while (newLineIndex != -1)
                {
                    InsertRaw(span.Slice(0, newLineIndex), position, skipNewLineCheck: true);
                    position += newLineIndex;
                    span = span.Slice(newLineIndex + 1);
                    newLineIndex = span.IndexOf(newLineSpan);
                }
            }

            EnsureSpace(span.Length);
            if (position < _length)
            {
                Array.Copy(_builder, position, _builder, span.Length + position, _length - position);
            }

            span.CopyTo(_builder.AsSpan(position));
            _length += span.Length;
            return this;
        }

        internal CodeWriter WriteIdentifier(string identifier)
        {
            if (StringExtensions.IsCSharpKeyword(identifier))
            {
                AppendRaw("@");
            }
            return AppendRaw(identifier);
        }

        internal CodeWriter WriteDeclaration(string declaration)
        {
            foreach (var scope in _scopes)
            {
                scope.AllDefinedIdentifiers.Add(declaration);
            }

            _scopes.Peek().Identifiers.Add(declaration);

            return WriteIdentifier(declaration);
        }

        public CodeWriter WriteDeclaration(CodeWriterDeclaration declaration)
        {
            if (_writingXmlDocumentation)
            {
                throw new InvalidOperationException("Can't declare variables inside documentation.");
            }

            declaration.SetActualName(GetTemporaryVariable(declaration.RequestedName));
            _scopes.Peek().Declarations.Add(declaration);
            return WriteDeclaration(declaration.ActualName);
        }

        public IDisposable WriteMethodDeclaration(MethodSignatureBase methodBase, params string[] disabledWarnings)
        {
            var outerScope = WriteMethodDeclarationNoScope(methodBase, disabledWarnings);
            WriteLine();
            var innerScope = Scope();
            return Disposable.Create(() =>
            {
                innerScope.Dispose();
                outerScope.Dispose();
            });
        }

        public IDisposable WriteMethodDeclarationNoScope(MethodSignatureBase methodBase, params string[] disabledWarnings)
        {
            if (methodBase.Attributes is { } attributes)
            {
                foreach (var attribute in attributes)
                {
                    if (attribute.Arguments.Any())
                    {
                        Append($"[{attribute.Type}(");
                        foreach (var argument in attribute.Arguments)
                        {
                            argument.Write(this);
                        }
                        RemoveTrailingComma();
                        WriteRawLine(")]");
                    }
                    else
                    {
                        WriteLine($"[{attribute.Type}]");
                    }
                }
            }

            foreach (var disabledWarning in disabledWarnings)
            {
                WriteLine($"#pragma warning disable {disabledWarning}");
            }

            AppendRawIf("public ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                .AppendRawIf("internal ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Internal))
                .AppendRawIf("protected ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Protected))
                .AppendRawIf("private ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Private))
                .AppendRawIf("static ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Static));

            if (methodBase is MethodSignature method)
            {
                AppendRawIf("virtual ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Virtual))
                    .AppendRawIf("override ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Override))
                    .AppendRawIf("new ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.New))
                    .AppendRawIf("async ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Async));

                if (method.ReturnType != null)
                {
                    Append($"{method.ReturnType} ");
                }
                else
                {
                    AppendRaw("void ");
                }

                if (method.ExplicitInterface is not null)
                {
                    Append($"{method.ExplicitInterface}.");
                }

                Append($"{methodBase.Name}");

                if (method?.GenericArguments != null)
                {
                    AppendRaw("<");
                    foreach (var argument in method.GenericArguments)
                    {
                        Append($"{argument:D},");
                    }
                    RemoveTrailingComma();
                    AppendRaw(">");
                }
            }
            else
            {
                Append($"{methodBase.Name}");
            }

            AppendRaw("(")
                .AppendRawIf("this ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Extension));

            var outerScope = AmbientScope();

            foreach (var parameter in methodBase.Parameters)
            {
                WriteParameter(parameter);
            }

            RemoveTrailingComma();
            Append($")");

            if (methodBase is MethodSignature { GenericParameterConstraints: { } constraints })
            {
                WriteLine();
                foreach (var constraint in constraints)
                {
                    constraint.Write(this);
                    AppendRaw(" ");
                }
            }

            if (methodBase is ConstructorSignature { Initializer: { } } constructor)
            {
                var (isBase, arguments) = constructor.Initializer;

                if (!isBase || arguments.Any())
                {
                    AppendRaw(isBase ? ": base(" : ": this(");
                    foreach (var argument in arguments)
                    {
                        argument.Write(this);
                        AppendRaw(", ");
                    }
                    RemoveTrailingComma();
                    AppendRaw(")");
                }
            }

            foreach (var disabledWarning in disabledWarnings)
            {
                WriteLine();
                Append($"#pragma warning restore {disabledWarning}");
            }

            return outerScope;
        }

        public override string ToString()
        {
            return ToString(true);
        }

        public string ToString(bool header)
        {
            if (_length == 0)
            {
                return string.Empty;
            }
            var builder = new StringBuilder(_length);
            IEnumerable<string> namespaces = _usingNamespaces
                .OrderByDescending(ns => ns.StartsWith("System"))
                .ThenBy(ns => ns, StringComparer.Ordinal);
            if (header)
            {
                string licenseString = CodeModelPlugin.Instance.CodeWriterExtensionMethods.LicenseString;
                if (!string.IsNullOrEmpty(licenseString))
                {
                    builder.Append(licenseString);
                    builder.Append(_newLine);
                    builder.Append(_newLine);
                }
                builder.Append("// <auto-generated/>");
                builder.Append(_newLine);
                builder.Append(_newLine);
                builder.Append("#nullable disable");
                builder.Append(_newLine);
                builder.Append(_newLine);

                foreach (string ns in namespaces)
                {
                    builder.Append("using ").Append(ns).Append(";").Append(_newLine);
                }

                if (namespaces.Any())
                {
                    builder.Append(_newLine);
                }
            }

            // Normalize newlines
            var spanLines = _builder.AsSpan(0, _length).EnumerateLines();
            int lineCount = 0;
            foreach (var line in spanLines)
            {
                builder.Append(line.TrimEnd());
                builder.Append(_newLine);
                lineCount++;
            }
            // Remove last new line if there are more than 1
            if (lineCount > 1)
            {
                builder.Remove(builder.Length - _newLine.Length, _newLine.Length);
            }
            return builder.ToString();
        }

        public sealed class CodeWriterScope : IDisposable
        {
            private readonly CodeWriter _writer;
            private readonly string? _end;
            private readonly bool _newLine;

            internal HashSet<string> Identifiers { get; } = new();

            internal HashSet<string> AllDefinedIdentifiers { get; } = new();

            internal List<CodeWriterDeclaration> Declarations { get; } = new();

            internal CodeWriterScope(CodeWriter writer, string? end, bool newLine)
            {
                _writer = writer;
                _end = end;
                _newLine = newLine;
            }

            public void Dispose()
            {
                if (_writer != null)
                {
                    _writer.PopScope(this);
                    foreach (var declaration in Declarations)
                    {
                        declaration.SetActualName(null);
                    }

                    Declarations.Clear();

                    if (_end != null)
                    {
                        _writer.TrimNewLines();
                        _writer.AppendRaw(_end);
                    }

                    if (_newLine)
                    {
                        _writer.WriteLine();
                    }
                }
            }
        }

        private void TrimNewLines()
        {
            while (PreviousLine.SequenceEqual(_newLine) &&
                CurrentLine.IsEmpty)
            {
                _length--;
            }
        }

        private void PopScope(CodeWriterScope expected)
        {
            var actual = _scopes.Pop();
            Debug.Assert(actual == expected);
        }

        private int? FindLastNonWhitespaceCharacterIndex()
        {
            var text = WrittenText;
            for (int i = text.Length - 1; i >= 0; i--)
            {
                if (char.IsWhiteSpace(text[i]))
                {
                    continue;
                }

                return i;
            }

            return null;
        }

        public void RemoveTrailingCharacter()
        {
            int? lastCharIndex = FindLastNonWhitespaceCharacterIndex();
            if (lastCharIndex.HasValue)
            {
                _length = lastCharIndex.Value;
            }
        }

        public void RemoveTrailingComma()
        {
            int? lastCharIndex = FindLastNonWhitespaceCharacterIndex();
            if (lastCharIndex.HasValue && WrittenText[lastCharIndex.Value] == ',')
            {
                _length = lastCharIndex.Value;
            }
        }

        public CodeWriterScope AmbientScope()
        {
            var codeWriterScope = new CodeWriterScope(this, null, false);
            _scopes.Push(codeWriterScope);
            return codeWriterScope;
        }

        internal void Append(CodeWriterDeclaration declaration)
        {
            WriteIdentifier(declaration.ActualName);
        }

        internal void WriteTypeModifiers(TypeSignatureModifiers modifiers)
        {
            AppendRawIf("public ", modifiers.HasFlag(TypeSignatureModifiers.Public))
                .AppendRawIf("internal ", modifiers.HasFlag(TypeSignatureModifiers.Internal))
                .AppendRawIf("private ", modifiers.HasFlag(TypeSignatureModifiers.Private))
                .AppendRawIf("static ", modifiers.HasFlag(TypeSignatureModifiers.Static))
                .AppendRawIf("sealed ", modifiers.HasFlag(TypeSignatureModifiers.Sealed))
                .AppendRawIf("partial ", modifiers.HasFlag(TypeSignatureModifiers.Partial)); // partial must be the last to write otherwise compiler will complain
        }

        public void WriteTypeArguments(IEnumerable<CSharpType>? typeArguments)
        {
            if (typeArguments is null)
            {
                return;
            }

            AppendRaw("<");
            foreach (var argument in typeArguments)
            {
                Append($"{argument}, ");
            }

            RemoveTrailingComma();
            AppendRaw(">");
        }

        public void WriteArguments(IEnumerable<ValueExpression> arguments, bool useSingleLine = true)
        {
            if (useSingleLine)
            {
                AppendRaw("(");
                foreach (var argument in arguments)
                {
                    argument.Write(this);
                    AppendRaw(", ");
                }

                RemoveTrailingComma();
                AppendRaw(")");
            }
            else
            {
                WriteRawLine("(");
                foreach (var argument in arguments)
                {
                    AppendRaw("\t");
                    argument.Write(this);
                    WriteRawLine(",");
                }

                RemoveTrailingCharacter();
                RemoveTrailingComma();
                AppendRaw(")");
            }
        }
    }
}
