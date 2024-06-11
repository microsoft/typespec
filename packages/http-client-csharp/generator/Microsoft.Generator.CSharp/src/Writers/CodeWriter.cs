// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp
{
    internal sealed partial class CodeWriter : IDisposable
    {
        private const char _newLine = '\n';
        private const char _space = ' ';

        private readonly HashSet<string> _usingNamespaces = new HashSet<string>();

        private readonly Stack<CodeScope> _scopes;
        private string? _currentNamespace;
        private UnsafeBufferSequence _builder;
        private bool _writingXmlDocumentation;
        private bool _atBeginningOfLine;

        internal CodeWriter()
        {
            _builder = new UnsafeBufferSequence(1024);

            _scopes = new Stack<CodeScope>();
            _scopes.Push(new CodeScope(this, "", false, 0));
            _atBeginningOfLine = true;
        }

        public CodeScope Scope(FormattableString line, string start = "{", string end = "}", bool newLine = true, CodeWriterScopeDeclarations? scopeDeclarations = null)
        {
            ValidateDeclarations(scopeDeclarations);
            CodeScope codeWriterScope = new CodeScope(this, end, newLine, _scopes.Peek().Depth + 1);
            _scopes.Push(codeWriterScope);
            WriteLine(line);
            WriteRawLine(start);
            AddDeclarationsToScope(scopeDeclarations);
            return codeWriterScope;
        }

        public CodeScope Scope()
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

        internal CodeScope ScopeRaw(string start = "{", string end = "}", bool newLine = true)
        {
            WriteRawLine(start);
            CodeScope codeWriterScope = new CodeScope(this, end, newLine, _scopes.Peek().Depth + 1);
            _scopes.Push(codeWriterScope);
            return codeWriterScope;
        }

        public CodeScope SetNamespace(string @namespace)
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
                        Literal(argument).Write(this);
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

        public void WriteMethod(MethodProvider method)
        {
            ArgumentNullException.ThrowIfNull(method, nameof(method));

            WriteMethodDocumentation(method.Signature);

            if (method.BodyStatements is { } body)
            {
                using (WriteMethodDeclaration(method.Signature))
                {
                    body.Write(this);
                }
            }
            else if (method.BodyExpression is { } expression)
            {
                using (WriteMethodDeclarationNoScope(method.Signature))
                {
                    AppendRaw(" => ");
                    expression.Write(this);
                    WriteRawLine(";");
                }
            }
        }

        public void WriteProperty(PropertyProvider property)
        {
            if (property.Description is not null)
            {
                WriteXmlDocumentationSummary(property.Description);
            }

            // TODO -- should write parameter xml doc if this is an IndexerDeclaration: https://github.com/microsoft/typespec/issues/3276

            if (property.Exceptions is not null)
            {
                foreach (var (exceptionType, description) in property.Exceptions)
                {
                    WriteXmlDocumentationException(exceptionType, [description]);
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

            Append($"{property.Type} ");

            if (property.ExplicitInterface is not null)
            {
                Append($"{property.ExplicitInterface}.");
            }
            if (property is IndexerProvider indexer)
            {
                Append($"{indexer.Name}[{indexer.IndexerParameter.Type} {indexer.IndexerParameter.Name}]");
            }
            else
            {
                Append($"{property.Name:I}");
            }

            switch (property.Body)
            {
                case ExpressionPropertyBody(var expression):
                    expression.Write(AppendRaw(" => "));
                    AppendRaw(";");
                    break;
                case AutoPropertyBody(var hasSetter, var setterModifiers, var initialization):
                    AppendRaw(" { get;");
                    if (hasSetter)
                    {
                        AppendRaw(" ");
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
                    using (ScopeRaw(newLine: false))
                    {
                        // write getter
                        WriteMethodPropertyAccessor("get", getter);
                        // write setter
                        if (setter is not null)
                        {
                            WriteMethodPropertyAccessor("set", setter, setterModifiers);
                        }
                    }
                    break;
                default:
                    throw new InvalidOperationException($"Unhandled property body type {property.Body}");
            }

            WriteLine();

            void WriteMethodPropertyAccessor(string name, MethodBodyStatement body, MethodSignatureModifiers modifiers = MethodSignatureModifiers.None)
            {
                WritePropertyAccessorModifiers(modifiers);
                WriteLine($"{name}");
                using (Scope())
                {
                    body.Write(this);
                }
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

        public void WriteParameter(ParameterProvider clientParameter)
        {
            if (clientParameter.Attributes.Any())
            {
                AppendRaw("[");
                for (int i = 0; i < clientParameter.Attributes.Length; i++)
                {
                    if (i == 0)
                    {
                        Append($"{clientParameter.Attributes[i].Type}");
                    }
                    else
                    {
                        Append($", {clientParameter.Attributes[i].Type}");
                    }
                }
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
        }

        public CodeWriter WriteField(FieldProvider field)
        {
            if (field.Description != null)
            {
                WriteXmlDocumentationSummary([field.Description]);
            }

            var modifiers = field.Modifiers;

            AppendRaw(modifiers.HasFlag(FieldModifiers.Public) ? "public " : (modifiers.HasFlag(FieldModifiers.Internal) ? "internal " : "private "))
                .AppendRawIf("const ", modifiers.HasFlag(FieldModifiers.Const))
                .AppendRawIf("static ", modifiers.HasFlag(FieldModifiers.Static))
                .AppendRawIf("readonly ", modifiers.HasFlag(FieldModifiers.ReadOnly));

            if (field.Declaration.HasBeenDeclared)
            {
                Append($"{field.Type} {field.Declaration:I}");
            }
            else
            {
                Append($"{field.Type} {field.Declaration:D}");
            }

            if (field.InitializationValue != null &&
                (modifiers.HasFlag(FieldModifiers.Const) || modifiers.HasFlag(FieldModifiers.Static)))
            {
                AppendRaw(" = ");
                field.InitializationValue.Write(this);
            }

            return WriteLine($";");
        }

        public CodeWriter WriteParametersValidation(IEnumerable<ParameterProvider> parameters)
        {
            bool wroteValidation = false;
            foreach (ParameterProvider parameter in parameters)
            {
                MethodBodyStatement validationStatement = Argument.ValidateParameter(parameter);
                wroteValidation |= !validationStatement.Equals(EmptyStatement);
                validationStatement.Write(this);
            }
            if (wroteValidation)
            {
                WriteLine();
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

            foreach (CodeScope codeWriterScope in _scopes)
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

                    if (i < arguments.Count - 1)
                        AppendRaw(",");
                }
            }
        }

        private void AppendType(CSharpType type, bool isDeclaration, bool writeTypeNameOnly)
        {
            if (type.IsArray && type.FrameworkType.GetGenericArguments().Any())
            {
                AppendType(type.FrameworkType.GetElementType()!, isDeclaration, writeTypeNameOnly);
                AppendRaw("[]");
                return;
            }

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
                for (int i = 0; i < type.Arguments.Count; i++)
                {
                    AppendType(type.Arguments[i], false, writeTypeNameOnly);
                    if (i != type.Arguments.Count - 1)
                    {
                        AppendRaw(_writingXmlDocumentation ? "," : ", ");
                    }
                }
                AppendRaw(_writingXmlDocumentation ? "}" : ">");
            }

            if (!isDeclaration && type is { IsNullable: true, IsValueType: true })
            {
                AppendRaw("?");
            }
        }

        public CodeWriter WriteLine(FormattableString formattableString)
        {
            Append(formattableString);
            return WriteLine();
        }

        public CodeWriter WriteLine() => AppendRawChar(_newLine);

        public CodeWriter WriteRawLine(string str)
        {
            AppendRaw(str);
            return WriteLine();
        }

        public CodeWriter AppendRaw(string str) => AppendRaw(str.AsSpan());

        private CodeWriter AppendRawChar(char c)
        {
            var destination = _builder.GetSpan(1);
            destination[0] = c;
            _builder.Advance(1);
            _atBeginningOfLine = true;
            return this;
        }

        private CodeWriter AppendRaw(ReadOnlySpan<char> span)
        {
            if (span.Length == 0 )
                return this;

            AddSpaces();

            var destination = _builder.GetSpan(span.Length);
            span.CopyTo(destination);
            _builder.Advance(span.Length);

            _atBeginningOfLine = span[span.Length - 1] == _newLine;
            return this;
        }

        private void AddSpaces()
        {
            int spaces = _atBeginningOfLine ? (_scopes.Peek().Depth) * 4 : 0;
            if (spaces == 0)
                return;

            var destination = _builder.GetSpan(spaces);
            destination.Slice(0, spaces).Fill(_space);
            _builder.Advance(spaces);
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
            foreach (var attribute in methodBase.Attributes)
            {
                attribute.Write(this);
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

                var isImplicitOrExplicit = methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Implicit) || methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Explicit);
                if (!isImplicitOrExplicit)
                {
                    if (method.ReturnType != null)
                    {
                        Append($"{method.ReturnType} ");
                    }
                    else
                    {
                        AppendRaw("void ");
                    }
                }

                AppendRawIf("implicit ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Implicit))
                    .AppendRawIf("explicit ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Explicit))
                    .AppendRawIf("operator ", methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Operator));

                if (isImplicitOrExplicit)
                {
                    Append($"{method.ReturnType}");
                }

                if (method.ExplicitInterface is not null)
                {
                    Append($"{method.ExplicitInterface}.");
                }

                Append($"{methodBase.Name}");

                if (method?.GenericArguments != null)
                {
                    AppendRaw("<");
                    for (int i = 0; i < method.GenericArguments.Count; i++)
                    {
                        Append($"{method.GenericArguments[i]}");
                        if (i != method.GenericArguments.Count - 1)
                        {
                            AppendRaw(", ");
                        }
                    }
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

            for (int i = 0; i < methodBase.Parameters.Count; i++)
            {
                WriteParameter(methodBase.Parameters[i]);
                if (i != methodBase.Parameters.Count - 1)
                {
                    AppendRaw(", ");
                }
            }
            Append($")");

            if (methodBase is MethodSignature { GenericParameterConstraints: { } constraints })
            {
                using (ScopeRaw(string.Empty, string.Empty, false))
                {
                    foreach (var constraint in constraints)
                    {
                        constraint.Write(this);
                        AppendRaw(" ");
                    }
                }
            }

            if (methodBase is ConstructorSignature { Initializer: { } } constructor)
            {
                var (isBase, arguments) = constructor.Initializer;

                if (!isBase || arguments.Any())
                {
                    AppendRaw(isBase ? ": base(" : ": this(");
                    var iterator = arguments.GetEnumerator();
                    if (iterator.MoveNext())
                    {
                        iterator.Current.Write(this);
                        while (iterator.MoveNext())
                        {
                            AppendRaw(", ");
                            iterator.Current.Write(this);
                        }
                    }
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
            var reader = _builder.ExtractReader();
            var totalLength = reader.Length;
            if (totalLength == 0)
                return string.Empty;

            var builder = new StringBuilder((int)totalLength);
            IEnumerable<string> namespaces = _usingNamespaces
                .OrderByDescending(ns => ns.StartsWith("System"))
                .ThenBy(ns => ns, StringComparer.Ordinal);
            if (header)
            {
                string licenseString = CodeModelPlugin.Instance.LicenseString;
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

            reader.CopyTo(builder, default);
            return builder.ToString();
        }

        private void PopScope(CodeScope expected)
        {
            var actual = _scopes.Pop();
            Debug.Assert(actual == expected);
        }

        public CodeScope AmbientScope()
        {
            var codeWriterScope = new CodeScope(this, null, false, _scopes.Peek().Depth);
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
                .AppendRawIf("readonly ", modifiers.HasFlag(TypeSignatureModifiers.ReadOnly))
                .AppendRawIf("static ", modifiers.HasFlag(TypeSignatureModifiers.Static))
                .AppendRawIf("sealed ", modifiers.HasFlag(TypeSignatureModifiers.Sealed))
                .AppendRawIf("partial ", modifiers.HasFlag(TypeSignatureModifiers.Partial)); // partial must be the last to write otherwise compiler will complain

            AppendRawIf("class ", modifiers.HasFlag(TypeSignatureModifiers.Class))
                .AppendRawIf("struct ", modifiers.HasFlag(TypeSignatureModifiers.Struct))
                .AppendRawIf("enum ", modifiers.HasFlag(TypeSignatureModifiers.Enum))
                .AppendRawIf("interface ", modifiers.HasFlag(TypeSignatureModifiers.Interface));
        }

        public void WriteTypeArguments(IEnumerable<CSharpType>? typeArguments)
        {
            if (typeArguments is null)
            {
                return;
            }

            AppendRaw("<");
            var iterator = typeArguments.GetEnumerator();
            if (iterator.MoveNext())
            {
                Append($"{iterator.Current}");
                while (iterator.MoveNext())
                {
                    AppendRaw(", ");
                    Append($"{iterator.Current}");
                }
            }
            AppendRaw(">");
        }

        public void WriteArguments(IEnumerable<ValueExpression> arguments, bool useSingleLine = true)
        {
            if (useSingleLine)
            {
                AppendRaw("(");
                var iterator = arguments.GetEnumerator();
                if (iterator.MoveNext())
                {
                    iterator.Current.Write(this);
                    while (iterator.MoveNext())
                    {
                        AppendRaw(", ");
                        iterator.Current.Write(this);
                    }
                }
                AppendRaw(")");
            }
            else
            {
                WriteRawLine("(");
                var iterator = arguments.GetEnumerator();
                if (iterator.MoveNext())
                {
                    AppendRaw("\t");
                    iterator.Current.Write(this);
                    WriteRawLine(",");
                    while (iterator.MoveNext())
                    {
                        AppendRaw(", ");
                        AppendRaw("\t");
                        iterator.Current.Write(this);
                        WriteRawLine(",");
                    }
                }
                AppendRaw(")");
            }
        }

        public void Dispose()
        {
            _builder?.Dispose();
        }
    }
}
