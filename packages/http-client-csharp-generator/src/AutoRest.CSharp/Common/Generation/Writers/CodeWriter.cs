// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Buffers;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis.CSharp;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class CodeWriter
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

        public CodeWriter()
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
            Line(line);
            LineRaw(start);
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
            LineRaw(start);
            CodeWriterScope codeWriterScope = new CodeWriterScope(this, end, newLine);
            _scopes.Push(codeWriterScope);
            return codeWriterScope;
        }

        public CodeWriterScope Namespace(string @namespace)
        {
            _currentNamespace = @namespace;
            Line($"namespace {@namespace}");
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
                        Declaration(declaration);
                        break;
                    case CodeWriterDeclaration declaration:
                        Append(declaration);
                        break;
                    case ValueExpression expression:
                        this.WriteValueExpression(expression);
                        break;
                    case var _ when isLiteralFormat:
                        Literal(argument);
                        break;
                    default:
                        string? s = argument?.ToString();
                        if (s == null)
                        {
                            throw new ArgumentNullException(index.ToString());
                        }

                        if (isDeclaration)
                        {
                            Declaration(s);
                        }
                        else if (isIdentifier)
                        {
                            Identifier(s);
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

        public void UseNamespace(string @namespace)
        {
            if (_currentNamespace == @namespace)
            {
                return;
            }

            // [TODO] Uncomment to remove unused namespaces
            //if (_currentNamespace is not null && _currentNamespace.Length > @namespace.Length && _currentNamespace.StartsWith(@namespace) && _currentNamespace[@namespace.Length] == '.')
            //{
            //    return;
            //}

            _usingNamespaces.Add(@namespace);
        }

        public CodeWriter WriteRawXmlDocumentation(FormattableString? content)
        {
            if (content is null)
                return this;

            var lines = content.ToString().Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            var xmlLines = string.Join('\n', lines.Select(l => "/// " + l));
            AppendRaw(xmlLines);
            Line();
            return this;
        }

        public CodeWriter AppendXmlDocumentation(FormattableString startTag, FormattableString endTag, FormattableString content)
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
                    Line();
                }

                return this;
            }

            Line();
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

        protected string GetTemporaryVariable(string s)
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
                    if (TypeFactory.IsArray(argument))
                    {
                        AppendRaw(" an array of type ");
                        argument = TypeFactory.GetElementType(argument);
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
                if (type.FrameworkType.IsGenericParameter && type.IsNullable)
                {
                    AppendRaw("?");
                }
            }
            else if (isDeclaration && !type.IsFrameworkType)
            {
                AppendRaw(type.Implementation.Declaration.Name);
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

        public CodeWriter Literal(object? o)
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
                sbyte sc => SyntaxFactory.Literal(sc).ToString(),
                byte b => SyntaxFactory.Literal(b).ToString(),
                bool b => b ? "true" : "false",
                BinaryData bd => bd.ToArray().Length == 0 ? "new byte[] { }" : SyntaxFactory.Literal(bd.ToString()).ToString(),
                _ => throw new NotImplementedException($"Unknown literal type {o?.GetType().Name ?? "'null'"}")
            });
        }

        public CodeWriter Line(FormattableString formattableString)
        {
            Append(formattableString);
            Line();

            return this;
        }

        public CodeWriter Line()
        {
            LineRaw(string.Empty);

            return this;
        }

        public ReadOnlySpan<char> WrittenText => _builder.AsSpan(0, _length);

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

        public CodeWriter LineRaw(string str)
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

        public CodeWriter Identifier(string identifier)
        {
            if (StringExtensions.IsCSharpKeyword(identifier))
            {
                AppendRaw("@");
            }
            return AppendRaw(identifier);
        }

        protected CodeWriter Declaration(string declaration)
        {
            foreach (var scope in _scopes)
            {
                scope.AllDefinedIdentifiers.Add(declaration);
            }

            _scopes.Peek().Identifiers.Add(declaration);

            return Identifier(declaration);
        }

        public virtual CodeWriter Declaration(CodeWriterDeclaration declaration)
        {
            if (_writingXmlDocumentation)
            {
                throw new InvalidOperationException("Can't declare variables inside documentation.");
            }

            declaration.SetActualName(GetTemporaryVariable(declaration.RequestedName));
            _scopes.Peek().Declarations.Add(declaration);
            return Declaration(declaration.ActualName);
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
                builder.Append(Configuration.ApiTypes.LicenseString);
                builder.AppendLine("// <auto-generated/>");
                builder.AppendLine();
                builder.AppendLine("#nullable disable");
                builder.AppendLine();

                foreach (string ns in namespaces)
                {
                    builder.Append("using ").Append(ns).AppendLine(";");
                }

                if (namespaces.Any())
                {
                    builder.AppendLine();
                }
            }

            // Normalize newlines
            var spanLines = _builder.AsSpan(0, _length).EnumerateLines();
            int lineCount = 0;
            foreach (var line in spanLines)
            {
                builder.Append(line.TrimEnd());
                builder.AppendLine();
                lineCount++;
            }
            // Remove last new line if there are more than 1
            if (lineCount > 1)
            {
                builder.Remove(builder.Length - Environment.NewLine.Length, Environment.NewLine.Length);
            }
            return builder.ToString();
        }

        internal class CodeWriterScope : IDisposable
        {
            private readonly CodeWriter _writer;
            private readonly string? _end;
            private readonly bool _newLine;

            public HashSet<string> Identifiers { get; } = new();

            public HashSet<string> AllDefinedIdentifiers { get; } = new();

            public List<CodeWriterDeclaration> Declarations { get; } = new();

            public CodeWriterScope(CodeWriter writer, string? end, bool newLine)
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
                        _writer.Line();
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

        public virtual void Append(CodeWriterDeclaration declaration)
        {
            Identifier(declaration.ActualName);
        }

        internal void WriteClassModifiers(TypeSignatureModifiers modifiers)
        {
            this.AppendRawIf("public ", modifiers.HasFlag(TypeSignatureModifiers.Public))
                .AppendRawIf("internal ", modifiers.HasFlag(TypeSignatureModifiers.Internal))
                .AppendRawIf("private ", modifiers.HasFlag(TypeSignatureModifiers.Private))
                .AppendRawIf("partial ", modifiers.HasFlag(TypeSignatureModifiers.Partial))
                .AppendRawIf("static ", modifiers.HasFlag(TypeSignatureModifiers.Static))
                .AppendRawIf("sealed ", modifiers.HasFlag(TypeSignatureModifiers.Sealed));
        }
    }
}
