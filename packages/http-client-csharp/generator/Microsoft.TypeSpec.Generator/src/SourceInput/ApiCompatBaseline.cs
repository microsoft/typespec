// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    /// <summary>
    /// Represents the set of intentional, already-accepted breaking changes recorded in an
    /// <c>ApiCompat</c> baseline (suppression) file (for example the files under
    /// <c>eng/apicompatbaselines/&lt;AssemblyName&gt;.txt</c>).
    /// <para>
    /// The backward-compatibility system resurrects any public member that exists in the previous
    /// contract (<see cref="SourceInputModel.LastContract"/>) but is missing from the current
    /// generation. When such a removal has already been reviewed and accepted via an ApiCompat
    /// baseline, the generator must honor that decision and <b>not</b> regenerate a compatibility
    /// shim for the removed member -- otherwise it would re-introduce the intentionally removed API
    /// (and may reference types that no longer exist). This type lets the back-compat code recognize
    /// those accepted removals.
    /// </para>
    /// </summary>
    public sealed class ApiCompatBaseline
    {
        private const string TypesMustExist = "TypesMustExist";
        private const string MembersMustExist = "MembersMustExist";

        private readonly HashSet<string> _suppressedTypes;
        private readonly HashSet<MemberKey> _suppressedMembers;

        private ApiCompatBaseline(HashSet<string> suppressedTypes, HashSet<MemberKey> suppressedMembers)
        {
            _suppressedTypes = suppressedTypes;
            _suppressedMembers = suppressedMembers;
        }

        /// <summary>
        /// An empty baseline that suppresses nothing. Used when no baseline file is present.
        /// </summary>
        public static ApiCompatBaseline Empty { get; } =
            new(new HashSet<string>(StringComparer.Ordinal), new HashSet<MemberKey>());

        /// <summary>
        /// Gets a value indicating whether this baseline contains any suppressions.
        /// </summary>
        public bool IsEmpty => _suppressedTypes.Count == 0 && _suppressedMembers.Count == 0;

        /// <summary>
        /// Parses an ApiCompat baseline file from disk. Returns <see cref="Empty"/> when the file
        /// does not exist.
        /// </summary>
        public static ApiCompatBaseline FromFile(string path)
        {
            if (string.IsNullOrEmpty(path) || !File.Exists(path))
            {
                return Empty;
            }

            return Parse(File.ReadAllLines(path));
        }

        /// <summary>
        /// Parses the contents of an ApiCompat baseline file.
        /// </summary>
        public static ApiCompatBaseline Parse(IEnumerable<string> lines)
        {
            var suppressedTypes = new HashSet<string>(StringComparer.Ordinal);
            var suppressedMembers = new HashSet<MemberKey>();

            foreach (var rawLine in lines)
            {
                var line = rawLine?.Trim();
                if (string.IsNullOrEmpty(line))
                {
                    continue;
                }

                var separatorIndex = line!.IndexOf(':');
                if (separatorIndex < 0)
                {
                    continue;
                }

                var ruleId = line.Substring(0, separatorIndex).Trim();
                var message = line.Substring(separatorIndex + 1).Trim();

                // The element of interest is the first single-quoted token in the message.
                if (!TryExtractQuoted(message, out var quoted))
                {
                    continue;
                }

                switch (ruleId)
                {
                    case TypesMustExist:
                        suppressedTypes.Add(quoted);
                        break;
                    case MembersMustExist:
                        if (TryParseMember(quoted, out var memberKey))
                        {
                            suppressedMembers.Add(memberKey);
                        }
                        break;
                    // Other rule ids (e.g. CannotRemoveAttribute) do not describe a removed
                    // member/type that the back-compat system would resurrect, so they are ignored.
                    default:
                        break;
                }
            }

            return new ApiCompatBaseline(suppressedTypes, suppressedMembers);
        }

        /// <summary>
        /// Determines whether the removal of the type with the given fully-qualified name has been
        /// accepted in the baseline.
        /// </summary>
        public bool IsTypeSuppressed(string typeFullName)
            => !string.IsNullOrEmpty(typeFullName) && _suppressedTypes.Contains(typeFullName);

        /// <summary>
        /// Determines whether the removal of a member has been accepted in the baseline. Matching is
        /// performed on the declaring type's fully-qualified name, the member name, and the parameter
        /// count, which is sufficient to identify the removed member without depending on the exact
        /// textual format of parameter types. The removal of the declaring type itself (recorded as a
        /// <c>TypesMustExist</c> suppression) also implies all of its members are suppressed.
        /// </summary>
        public bool IsMemberSuppressed(string declaringTypeFullName, string memberName, int parameterCount)
        {
            if (string.IsNullOrEmpty(declaringTypeFullName) || string.IsNullOrEmpty(memberName))
            {
                return false;
            }

            if (_suppressedTypes.Contains(declaringTypeFullName))
            {
                return true;
            }

            return _suppressedMembers.Contains(new MemberKey(declaringTypeFullName, memberName, parameterCount));
        }

        private static bool TryExtractQuoted(string message, out string value)
        {
            value = string.Empty;
            var start = message.IndexOf('\'');
            if (start < 0)
            {
                return false;
            }

            var end = message.IndexOf('\'', start + 1);
            if (end <= start)
            {
                return false;
            }

            value = message.Substring(start + 1, end - start - 1);
            return value.Length > 0;
        }

        // Parses an ApiCompat member signature of the form:
        //   [modifiers] ReturnType Namespace.DeclaringType.MemberName(ParamType, ...)
        // for example:
        //   public Ns.Result Ns.Factory.Make(Ns.Kind, System.String)
        //   public void Ns.Record..ctor(Ns.Kind, System.String)
        //   public Ns.Kind Ns.Record.Prop.get()
        private static bool TryParseMember(string signature, out MemberKey memberKey)
        {
            memberKey = default;

            var parenIndex = signature.IndexOf('(');
            if (parenIndex < 0 || !signature.EndsWith(")", StringComparison.Ordinal))
            {
                return false;
            }

            var beforeParen = signature.Substring(0, parenIndex).TrimEnd();
            // The fully-qualified member path is the last whitespace-delimited token (the tokens
            // before it are access modifiers and the return type).
            var lastSpace = beforeParen.LastIndexOf(' ');
            var memberPath = lastSpace >= 0 ? beforeParen.Substring(lastSpace + 1) : beforeParen;
            if (memberPath.Length == 0)
            {
                return false;
            }

            string declaringTypeFullName;
            string memberName;

            // Constructors are rendered as "DeclaringType..ctor".
            var ctorIndex = memberPath.IndexOf("..", StringComparison.Ordinal);
            if (ctorIndex > 0)
            {
                declaringTypeFullName = memberPath.Substring(0, ctorIndex);
                memberName = memberPath.Substring(ctorIndex + 1); // ".ctor" / ".cctor"
            }
            else
            {
                var lastDot = memberPath.LastIndexOf('.');
                if (lastDot <= 0 || lastDot == memberPath.Length - 1)
                {
                    return false;
                }

                declaringTypeFullName = memberPath.Substring(0, lastDot);
                memberName = memberPath.Substring(lastDot + 1);

                // Property/event accessors are rendered as "DeclaringType.Member.get"/".set"; collapse
                // them onto the owning member so the suppression matches the accessor's owner.
                if (memberName is "get" or "set" or "add" or "remove")
                {
                    var ownerDot = declaringTypeFullName.LastIndexOf('.');
                    if (ownerDot > 0)
                    {
                        memberName = declaringTypeFullName.Substring(ownerDot + 1);
                        declaringTypeFullName = declaringTypeFullName.Substring(0, ownerDot);
                    }
                }
            }

            var parameterCount = CountParameters(signature.Substring(parenIndex + 1, signature.Length - parenIndex - 2));
            memberKey = new MemberKey(declaringTypeFullName, memberName, parameterCount);
            return true;
        }

        private static int CountParameters(string parameterList)
        {
            var trimmed = parameterList.Trim();
            if (trimmed.Length == 0)
            {
                return 0;
            }

            // Count top-level commas (ignoring those nested inside generic argument lists).
            var count = 1;
            var depth = 0;
            foreach (var c in trimmed)
            {
                switch (c)
                {
                    case '<':
                        depth++;
                        break;
                    case '>':
                        depth--;
                        break;
                    case ',':
                        if (depth == 0)
                        {
                            count++;
                        }
                        break;
                }
            }

            return count;
        }

        private readonly struct MemberKey : IEquatable<MemberKey>
        {
            private readonly string _declaringTypeFullName;
            private readonly string _memberName;
            private readonly int _parameterCount;

            public MemberKey(string declaringTypeFullName, string memberName, int parameterCount)
            {
                _declaringTypeFullName = declaringTypeFullName;
                _memberName = memberName;
                _parameterCount = parameterCount;
            }

            public bool Equals(MemberKey other)
                => string.Equals(_declaringTypeFullName, other._declaringTypeFullName, StringComparison.Ordinal)
                   && string.Equals(_memberName, other._memberName, StringComparison.Ordinal)
                   && _parameterCount == other._parameterCount;

            public override bool Equals(object? obj) => obj is MemberKey other && Equals(other);

            public override int GetHashCode()
                => HashCode.Combine(_declaringTypeFullName, _memberName, _parameterCount);
        }
    }
}
