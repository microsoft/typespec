// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Statements
{
    public class XmlDocExceptionStatement : MethodBodyStatement
    {
        //($"<exception cref=\"{ExceptionType}\">", "</exception>", Text)
        public Type ExceptionType { get; }
        public IReadOnlyList<ParameterProvider> Parameters { get; }

        private string _reason;

        public XmlDocExceptionStatement(ParameterValidationType validationType, IReadOnlyList<ParameterProvider> parameters)
        {
            ExceptionType = GetExceptionType(validationType);
            Parameters = parameters;
            _reason = GetText(validationType);
        }

        public XmlDocExceptionStatement(Type exceptionType, string reason, IReadOnlyList<ParameterProvider> parameters)
        {
            ExceptionType = exceptionType;
            Parameters = parameters;
            _reason = reason;
        }

        private static Type GetExceptionType(ParameterValidationType validationType) => validationType switch
        {
            ParameterValidationType.AssertNotNull => typeof(ArgumentNullException),
            ParameterValidationType.AssertNotNullOrEmpty => typeof(ArgumentException),
            _ => throw new ArgumentOutOfRangeException(nameof(validationType), validationType, $"Cannot create an XmlDocExceptionStatement with {validationType} validationType")
        };

        private static string GetText(ParameterValidationType validationType) => validationType switch
        {
            ParameterValidationType.AssertNotNull => "is null.",
            ParameterValidationType.AssertNotNullOrEmpty => "is an empty string, and was expected to be non-empty.",
            _ => throw new ArgumentOutOfRangeException(nameof(validationType), validationType, $"Cannot create an XmlDocExceptionStatement with {validationType} validationType")
        };

        internal override void Write(CodeWriter writer)
        {
            using var scope = new CodeWriter.XmlDocWritingScope(writer);

            writer.Append($"/// <exception cref=\"{ExceptionType}\">");

            if (Parameters.Count > 0)
            {
                writer.Append($" <paramref name=\"{Parameters[0].Name}\"/>");
                for (int i = 1; i < Parameters.Count - 1; i++)
                {
                    writer.Append($", <paramref name=\"{Parameters[i].Name}\"/>");
                }
                if (Parameters.Count > 1)
                    writer.Append($" or <paramref name=\"{Parameters[Parameters.Count - 1].Name}\"/>");
            }

            writer.WriteLine($" {_reason} </exception>");
        }
    }
}
