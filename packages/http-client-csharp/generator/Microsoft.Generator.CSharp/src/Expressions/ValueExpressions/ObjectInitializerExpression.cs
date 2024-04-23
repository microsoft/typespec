﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents an object initializer expression.
    /// </summary>
    /// <param name="Parameters">The parameters to initialize the object to.</param>
    /// <param name="UseSingleLine">Flag to determine if the object should be initialized inline.</param>
    public sealed record ObjectInitializerExpression(IReadOnlyDictionary<string, ValueExpression>? Parameters = null, bool UseSingleLine = true) : InitializerExpression
    {
        public override void Write(CodeWriter writer)
        {
            if (Parameters is not { Count: > 0 })
            {
                writer.AppendRaw("{}");
                return;
            }

            if (UseSingleLine)
            {
                writer.AppendRaw("{");
                foreach (var (name, value) in Parameters)
                {
                    writer.Append($"{name} = ");
                    value.Write(writer);
                    writer.AppendRaw(", ");
                }

                writer.RemoveTrailingComma();
                writer.AppendRaw("}");
            }
            else
            {
                writer.WriteLine();
                writer.WriteRawLine("{");
                foreach (var (name, value) in Parameters)
                {
                    writer.Append($"{name} = ");
                    value.Write(writer);
                    writer.WriteRawLine(",");
                }

                writer.AppendRaw("}");
            }
        }
    }
}
