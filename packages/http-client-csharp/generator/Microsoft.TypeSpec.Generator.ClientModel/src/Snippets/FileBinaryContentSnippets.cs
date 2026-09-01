// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    /// <summary>
    /// Provides snippet helpers for constructing <see cref="FileBinaryContent"/> instances.
    /// </summary>
    internal static class FileBinaryContentSnippets
    {
#pragma warning disable SCME0004 // FileBinaryContent is evaluation-only.
        private static readonly CSharpType _type = typeof(FileBinaryContent);

        public static ValueExpression New(ValueExpression source)
            => Snippet.New.Instance(_type, [source]);

        public static ValueExpression New(ValueExpression source, ScopedApi<string> contentType)
            => Snippet.New.Instance(_type, [source, contentType]);

        public static ValueExpression New(ValueExpression source, ScopedApi<string>? contentType, ScopedApi<string> filename)
        {
            var ctorArgs = contentType is null
                ? new List<ValueExpression> { source }
                : new List<ValueExpression> { source, contentType };

            return Snippet.New.Instance(
                _type,
                ctorArgs,
                new Dictionary<ValueExpression, ValueExpression>
                {
                    [Identifier(nameof(FileBinaryContent.Filename))] = filename
                },
                useSingleLineForPropertyInitialization: false);
        }

        /// <summary>
        /// Builds <c>{value}.TryComputeLength(out long {lengthVariableName})</c> and exposes the declared length variable.
        /// </summary>
        /// <param name="value">The <see cref="FileBinaryContent"/> expression to invoke on.</param>
        /// <param name="lengthVariable">The declared <c>long</c> variable that will receive the computed length.</param>
        /// <param name="lengthVariableName">The identifier to use for the declared length variable.</param>
        public static ScopedApi<bool> TryComputeLength(this ScopedApi<FileBinaryContent> value, out VariableExpression lengthVariable, string lengthVariableName = "length")
        {
            lengthVariable = new VariableExpression(typeof(long), lengthVariableName);
            return new InvokeMethodExpression(
                value,
                nameof(FileBinaryContent.TryComputeLength),
                [new DeclarationExpression(lengthVariable, IsOut: true)]).As<bool>();
        }

        /// <summary>
        /// Builds <c>{value}.WriteTo({stream})</c> or <c>{value}.WriteTo({stream}, {cancellationToken})</c>.
        /// </summary>
        /// <param name="value">The <see cref="FileBinaryContent"/> expression to invoke on.</param>
        /// <param name="stream">The destination stream expression.</param>
        /// <param name="cancellationToken">Optional cancellation token expression; omitted when <c>null</c> so the target's default value applies.</param>
        public static InvokeMethodExpression WriteTo(this ScopedApi<FileBinaryContent> value, ValueExpression stream, ValueExpression? cancellationToken = null)
            => value.Invoke(
                nameof(FileBinaryContent.WriteTo),
                cancellationToken is null ? [stream] : [stream, cancellationToken]);
#pragma warning restore SCME0004
    }
}
