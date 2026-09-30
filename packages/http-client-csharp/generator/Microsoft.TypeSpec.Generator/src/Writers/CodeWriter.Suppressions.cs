// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed partial class CodeWriter
    {
        private readonly HashSet<string> _activeWarnings = new(StringComparer.Ordinal);

        internal IDisposable SuppressWarnings(IEnumerable<SuppressionStatement> suppressions, bool emitDirectives = true)
        {
            var added = new List<SuppressionStatement>();
            foreach (var suppression in suppressions)
            {
                if (_activeWarnings.Add(suppression.Code.ToDisplayString()))
                {
                    added.Add(suppression);
                    if (emitDirectives)
                    {
                        if (!_atBeginningOfLine)
                        {
                            WriteLine();
                        }
                        suppression.DisableStatement.Write(this);
                    }
                }
            }
            return new WarningScope(this, added, emitDirectives);
        }

        private sealed class WarningScope(CodeWriter writer, List<SuppressionStatement> suppressions, bool emitDirectives) : IDisposable
        {
            public void Dispose()
            {
                foreach (var suppression in suppressions)
                {
                    if (emitDirectives)
                    {
                        if (!writer._atBeginningOfLine)
                        {
                            writer.WriteLine();
                        }
                        suppression.RestoreStatement.Write(writer);
                    }
                    writer._activeWarnings.Remove(suppression.Code.ToDisplayString());
                }
            }
        }

        private static IEnumerable<SuppressionStatement> GetSignatureSuppressions(MethodSignatureBase signature)
        {
            return ExperimentalApiHelpers.MergeSuppressions(
                ExperimentalApiHelpers.GetReferenceSuppressions(signature.ReturnType),
                signature.Parameters.SelectMany(parameter => ExperimentalApiHelpers.MergeSuppressions(
                    ExperimentalApiHelpers.GetReferenceSuppressions(parameter.Type),
                    parameter.Property is { IsAdditionalProperties: true } property ? property.Suppressions : [],
                    ExperimentalApiHelpers.GetReferenceSuppressions(parameter.InputParameter?.Type ?? parameter.Property?.InputProperty?.Type))));
        }
    }
}
