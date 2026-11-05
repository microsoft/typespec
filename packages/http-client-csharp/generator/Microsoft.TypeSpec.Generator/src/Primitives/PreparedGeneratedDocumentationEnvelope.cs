// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// Bounded documentation data that cannot escape the writer's line comments.
    /// This is one prerequisite of a generated declaration envelope, not lookup or selection evidence.
    /// </summary>
    internal sealed class PreparedGeneratedDocumentationEnvelope
    {
        private static readonly Type FactoryStringType = FormattableStringFactory.Create(string.Empty, []).GetType();
        private readonly List<Func<bool>> _checks = [];
        private readonly HashSet<object> _ancestors = new(ReferenceEqualityComparer.Instance);
        private int _stale;
        private readonly HashSet<string> _importNamespaces = new(StringComparer.Ordinal);
        internal IEnumerable<string> ImportNamespaces => _importNamespaces;
        private readonly List<CSharpType> _importTypes = [];
        internal IEnumerable<CSharpType> ImportTypes => _importTypes;

        internal static PreparedGeneratedDocumentationEnvelope? TryCapture(XmlDocProvider docs)
        {
            var envelope = new PreparedGeneratedDocumentationEnvelope();
            return envelope.Capture(docs) ? envelope : null;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_checks.All(check => check())) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        private bool Capture(XmlDocProvider docs)
        {
            if (docs.GetType() != typeof(XmlDocProvider) ||
                !ContractCollections.TryCopy(docs.Parameters, out var parameters) ||
                !ContractCollections.TryCopy(docs.Exceptions, out var exceptions) || !exceptions.IsEmpty) { return false; }
            // Exception reasons have a separate, privately retained write surface.
            // They are unsupported here rather than inferred from the ordinary Lines view.
            var summary = docs.Summary;
            var returns = docs.Returns;
            var inherit = docs.Inherit;
            _checks.Add(() => ReferenceEquals(docs.Summary, summary) && ReferenceEquals(docs.Returns, returns) &&
                ReferenceEquals(docs.Inherit, inherit) && ContractCollections.SameReferences(docs.Parameters, parameters) &&
                ContractCollections.SameReferences(docs.Exceptions, exceptions));
            return (summary is null || CaptureStatement(summary, 0)) &&
                (returns is null || CaptureStatement(returns, 0)) && parameters.All(p => p is not null && CaptureStatement(p, 0)) &&
                (inherit is null || inherit.GetType() == typeof(XmlDocInheritStatement));
        }

        private bool CaptureStatement(XmlDocStatement statement, int depth)
        {
            var type = statement.GetType();
            if (depth > 32 || (type != typeof(XmlDocStatement) && type != typeof(XmlDocSummaryStatement) &&
                type != typeof(XmlDocParamStatement) && type != typeof(XmlDocReturnsStatement)) || !_ancestors.Add(statement)) { return false; }
            if (!ContractCollections.TryCopy(statement.Lines, out var lines) ||
                !ContractCollections.TryCopy(statement.InnerStatements, out var children)) { return false; }
            var start = statement.StartTag;
            var end = statement.EndTag;
            _checks.Add(() => ReferenceEquals(statement.StartTag, start) && ReferenceEquals(statement.EndTag, end) &&
                ContractCollections.SameReferences(statement.Lines, lines) && ContractCollections.SameReferences(statement.InnerStatements, children));
            var result = CaptureFormat(start, depth + 1) && CaptureFormat(end, depth + 1) &&
                lines.All(line => CaptureFormat(line, depth + 1)) && children.All(child => child is not null && CaptureStatement(child, depth + 1));
            _ancestors.Remove(statement);
            return result;
        }

        private bool CaptureFormat(FormattableString value, int depth)
        {
            // Type check precedes every user-overridable formatter accessor.
            if (value is null || depth > 32 || value.GetType() != FactoryStringType || !_ancestors.Add(value)) { return false; }
            var format = value.Format;
            var arguments = value.GetArguments().ToArray();
            if (!SafeFormat(format, arguments.Length) || arguments.Any(arg => !CaptureArgument(arg, depth + 1))) { return false; }
            _checks.Add(() => value.Format == format && SameArguments(value.GetArguments(), arguments));
            _ancestors.Remove(value);
            return true;
        }

        private bool CaptureArgument(object? argument, int depth)
        {
            if (depth > 32) { return false; }
            switch (argument)
            {
                case null:
                    return false;
                case string text:
                    return SingleLine(text);
                case char character:
                    return SingleLine(character.ToString());
                // The writer's numeric ToString fallback is culture-sensitive.
                // A later culture change can introduce newlines even for values
                // captured under invariant culture. Do not certify that family.
                case bool:
                    return true;
                case FormattableString nested:
                    return CaptureFormat(nested, depth);
                case CodeWriterDeclaration declaration:
                    var name = declaration.RequestedName;
                    var revision = declaration.SourceRevision;
                    if (!Identifier(name)) { return false; }
                    _checks.Add(() => declaration.SourceRevision == revision && declaration.RequestedName == name);
                    return true;
                case CSharpType type:
                    if (!SafeType(type, depth) || !DeclaredTypeSnapshot.TryCapture(type, out var snapshot)) { return false; }
                    _checks.Add(() => snapshot!.IsCurrent());
                    CaptureImportNamespaces(type);
                    _importTypes.Add(type);
                    return true;
                default:
                    return false;
            }
        }

        private static bool SafeType(CSharpType type, int depth) => depth <= 32 && type.GetType() == typeof(CSharpType) &&
            Identifier(type.Name) && (type.Namespace.Length == 0 || type.Namespace.Split('.').All(Identifier)) &&
            ContractCollections.TryCopy(type.Arguments, out var arguments) && arguments.All(a => a is not null && SafeType(a, depth + 1)) &&
            (type.DeclaringType is null || SafeType(type.DeclaringType, depth + 1));

        private void CaptureImportNamespaces(CSharpType type)
        {
            // SafeType already audited this owned, acyclic, bounded type graph.
            _importNamespaces.Add(type.Namespace);
            if (type.DeclaringType is { } declaring) { CaptureImportNamespaces(declaring); }
            if (ContractCollections.TryCopy(type.Arguments, out var arguments))
            {
                foreach (var argument in arguments) { CaptureImportNamespaces(argument); }
            }
        }

        private static bool SameArguments(object?[] current, object?[] captured)
        {
            if (current.Length != captured.Length) { return false; }
            for (var index = 0; index < current.Length; index++)
            {
                if (!ReferenceEquals(current[index], captured[index])) { return false; }
            }
            return true;
        }

        private static bool SingleLine(string value) => value.IndexOfAny(['\r', '\n', '\u0085', '\u2028', '\u2029']) < 0;

        private static bool Identifier(string value) => value.Length > 0 && (value[0] == '_' || char.IsAsciiLetter(value[0])) &&
            value.All(c => c == '_' || char.IsAsciiLetterOrDigit(c));

        private static bool SafeFormat(string format, int argumentCount)
        {
            if (!SingleLine(format)) { return false; }
            for (var index = 0; index < format.Length; index++)
            {
                var c = format[index];
                if (c != '{' && c != '}') { continue; }
                if (index + 1 < format.Length && format[index + 1] == c) { index++; continue; }
                if (c == '}') { return false; }
                index++;
                var start = index;
                var ordinal = 0;
                while (index < format.Length && char.IsAsciiDigit(format[index]))
                {
                    if (ordinal > (int.MaxValue - 9) / 10) { return false; }
                    ordinal = ordinal * 10 + format[index++] - '0';
                }
                if (index == start || ordinal >= argumentCount) { return false; }
                if (index < format.Length && format[index] == ':')
                {
                    index++;
                    // No declaration-emitting D format, arbitrary formatters or alignments.
                    if (index >= format.Length || (format[index] != 'I' && format[index] != 'C')) { return false; }
                    index++;
                }
                if (index >= format.Length || format[index] != '}') { return false; }
            }
            return true;
        }
    }
}
