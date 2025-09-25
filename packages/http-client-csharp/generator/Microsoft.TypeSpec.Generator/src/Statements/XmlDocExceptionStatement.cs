// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class XmlDocExceptionStatement : MethodBodyStatement
    {
        //($"<exception cref=\"{ExceptionType}\">", "</exception>", Text)
        public Type ExceptionType { get; }
        public IReadOnlyList<ParameterProvider> Parameters { get; }

        private readonly string _reason;

        public XmlDocExceptionStatement(Type exceptionType, IReadOnlyList<ParameterProvider> parameters)
        {
            ExceptionType = exceptionType;
            Parameters = parameters;
            _reason = GetText(exceptionType);
        }

        public XmlDocExceptionStatement(Type exceptionType, string reason, IReadOnlyList<ParameterProvider> parameters)
        {
            ExceptionType = exceptionType;
            Parameters = parameters;
            _reason = reason;
        }

        private static string GetText(Type exceptionType) => exceptionType switch
        {
            { } when exceptionType == typeof(ArgumentNullException) => "is null.",
            { } when exceptionType == typeof(ArgumentException) => "is an empty string, and was expected to be non-empty.",
            _ => throw new ArgumentOutOfRangeException(nameof(exceptionType), exceptionType, $"Cannot create an XmlDocExceptionStatement with {exceptionType} exceptionType")
        };

        internal override void Write(CodeWriter writer)
        {
            using var scope = new CodeWriter.XmlDocWritingScope(writer);

            writer.Append($"/// <exception cref=\"{ExceptionType}\">");

            if (Parameters.Count > 0)
            {
                writer.Append($" <paramref name=\"{Parameters[0].AsVariable().Declaration}\"/>");
                for (int i = 1; i < Parameters.Count - 1; i++)
                {
                    writer.Append($", <paramref name=\"{Parameters[i].AsVariable().Declaration}\"/>");
                }
                if (Parameters.Count > 1)
                    writer.Append($" or <paramref name=\"{Parameters[Parameters.Count - 1].AsVariable().Declaration}\"/>");
            }

            writer.WriteLine($" {_reason} </exception>");
        }
    }
}
