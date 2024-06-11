// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    internal sealed partial class CodeWriter
    {
        private const string SingleArgFormat = "{0}";

        public CodeWriter WriteXmlDocumentationSummary(IReadOnlyList<FormattableString> lines)
        {
            return WriteXmlDocumentation("summary", lines);
        }

        public CodeWriter WriteXmlDocumentation(string tag, IReadOnlyList<FormattableString> lines)
        {
            return WriteDocumentationLines($"<{tag}>", $"</{tag}>", lines);
        }

        public CodeWriter WriteXmlDocumentationParameters(IEnumerable<ParameterProvider> parameters)
        {
            foreach (var parameter in parameters)
            {
                WriteXmlDocumentationParameter(parameter);
            }

            return this;
        }

        public CodeWriter WriteXmlDocumentationParameter(string name, IReadOnlyList<FormattableString> lines)
        {
            return WriteDocumentationLines($"<param name=\"{name}\">", $"</param>", lines);
        }

        /// <summary>
        /// Writes XML documentation for a parameter of a method using a "param" tag.
        /// </summary>
        /// <param name="writer">Writer to which code is written to.</param>
        /// <param name="parameter">The definition of the parameter, including name and description.</param>
        /// <returns></returns>
        public CodeWriter WriteXmlDocumentationParameter(ParameterProvider parameter)
        {
            return WriteXmlDocumentationParameter(parameter.Name, [parameter.Description]);
        }

        public CodeWriter WriteXmlDocumentationException(CSharpType exception, IReadOnlyList<FormattableString> lines)
        {
            return WriteDocumentationLines($"<exception cref=\"{exception}\">", $"</exception>", lines);
        }

        public CodeWriter WriteXmlDocumentationReturns(FormattableString text)
        {
            return WriteDocumentationLines($"<returns>", $"</returns>", [text]);
        }

        public CodeWriter WriteXmlDocumentationInclude(string filename, MethodSignature methodSignature, out string memberId)
        {
            // We use short names of types for external doc reference member id
            // This is not good enough for cref, but for now works as member id
            // Change to cref-style names if needed
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

        public CodeWriter WriteXmlDocumentationRequiredParametersException(IEnumerable<ParameterProvider> parameters)
        {
            return WriteXmlDocumentationParametersExceptions(typeof(ArgumentNullException), parameters.Where(p => p.Validation is ParameterValidationType.AssertNotNull or ParameterValidationType.AssertNotNullOrEmpty).ToArray(), " is null.");
        }

        public CodeWriter WriteXmlDocumentationNonEmptyParametersException(IEnumerable<ParameterProvider> parameters)
        {
            return WriteXmlDocumentationParametersExceptions(typeof(ArgumentException), parameters.Where(p => p.Validation == ParameterValidationType.AssertNotNullOrEmpty).ToArray(), " is an empty string, and was expected to be non-empty.");
        }

        private CodeWriter WriteXmlDocumentationParametersExceptions(Type exceptionType, IReadOnlyCollection<ParameterProvider> parameters, string reason)
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
            return WriteXmlDocumentationException(exceptionType, [description]);
        }

        public CodeWriter WriteDocumentationLines(FormattableString startTag, FormattableString endTag, IReadOnlyList<FormattableString> lines)
            => AppendXmlDocumentation(startTag, endTag, lines);

        public CodeWriter WriteMethodDocumentation(MethodSignatureBase methodBase)
        {
            if (methodBase.NonDocumentComment is { } comment)
            {
                WriteLine($"// {comment}");
            }

            if (methodBase.SummaryText is { } summaryText)
            {
                WriteXmlDocumentationSummary([summaryText]);
            }

            return WriteMethodDocumentationSignature(methodBase);
        }

        public CodeWriter WriteMethodDocumentationSignature(MethodSignatureBase methodBase)
        {
            WriteXmlDocumentationParameters(methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Public) ? methodBase.Parameters : methodBase.Parameters.Where(p => p.Description is not null));

            WriteXmlDocumentationRequiredParametersException((IEnumerable<ParameterProvider>)methodBase.Parameters);
            WriteXmlDocumentationNonEmptyParametersException((IEnumerable<ParameterProvider>)methodBase.Parameters);
            if (methodBase is MethodSignature { ReturnDescription: { } } method)
            {
                WriteXmlDocumentationReturns(method.ReturnDescription);
            }

            return this;
        }

        public CodeWriter WriteXmlDocumentationInheritDoc(CSharpType? crefType = null)
            => crefType == null
                ? WriteLine($"/// <inheritdoc />")
                : WriteLine($"/// <inheritdoc cref=\"{crefType}\"/>");

        internal CodeWriter AppendXmlDocumentation(FormattableString startTag, FormattableString endTag, params FormattableString[] lines)
            => AppendXmlDocumentation(startTag, endTag, (IReadOnlyList<FormattableString>)lines);


        internal CodeWriter AppendXmlDocumentation(FormattableString startTag, FormattableString endTag, IReadOnlyList<FormattableString> lines)
        {
            Debug.Assert(!HasNewLines(lines, out var offendingLine), $"'{offendingLine!.ToString()}': contains a newline character.  Split this into multiple entries instead.");

            _writingXmlDocumentation = true;

            if (lines.Count == 0 || IsEmpty(lines))
            {
                WriteLine($"/// {startTag}{endTag}");
            }
            else if (lines.Count == 1)
            {
                //should we auto add the '.'?
                string lineFormat = lines[0].Format;
                string stringToCheck = lineFormat;
                if (lineFormat == SingleArgFormat && lines[0].ArgumentCount == 1 && lines[0].GetArgument(0) is string strLine)
                {
                    stringToCheck = strLine;
                }
                string period = stringToCheck.EndsWith(".") ? string.Empty : ".";
                WriteLine($"/// {startTag} {lines[0]}{period} {endTag}");
            }
            else
            {
                WriteLine($"/// {startTag}");
                foreach (var line in lines)
                {
                    WriteLine($"/// {line}");
                }
                WriteLine($"/// {endTag}");
            }

            _writingXmlDocumentation = false;

            return this;
        }

        private static bool IsEmpty(IReadOnlyList<FormattableString> lines)
        {
            if (lines.Count != 1)
            {
                return false;
            }

            string lineFormat = lines[0].Format;
            if (lineFormat.Equals(string.Empty))
            {
                return true;
            }

            if (lineFormat != SingleArgFormat)
            {
                return false;
            }

            var firstArg = lines[0].GetArgument(0);
            return firstArg is not null && firstArg.Equals(string.Empty);
        }

        private static bool HasNewLines(IReadOnlyList<FormattableString> lines, [MaybeNullWhen(false)] out FormattableString offendingLine)
        {
            offendingLine = null;
            foreach (var line in lines)
            {
                if (line.Format.Contains(_newLine))
                {
                    offendingLine = line;
                    return true;
                }
                for (int i = 0; i < line.ArgumentCount; i++)
                {
                    if (line.GetArgument(i) is string str && str.Contains(_newLine))
                    {
                        offendingLine = line;
                        return true;
                    }
                }
            }
            return false;
        }
    }
}
