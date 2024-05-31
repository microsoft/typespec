// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;

namespace Microsoft.Generator.CSharp
{
    internal sealed partial class CodeWriter
    {
        public CodeWriter WriteXmlDocumentationSummary(FormattableString? text)
        {
            return WriteXmlDocumentation("summary", text);
        }

        public CodeWriter WriteXmlDocumentation(string tag, FormattableString? text)
        {
            return WriteDocumentationLines($"<{tag}>", $"</{tag}>", text);
        }

        public CodeWriter WriteXmlDocumentationParameters(IEnumerable<Parameter> parameters)
        {
            foreach (var parameter in parameters)
            {
                WriteXmlDocumentationParameter(parameter);
            }

            return this;
        }

        public CodeWriter WriteXmlDocumentationParameter(string name, FormattableString? text)
        {
            return WriteDocumentationLines($"<param name=\"{name}\">", $"</param>", text);
        }

        /// <summary>
        /// Writes XML documentation for a parameter of a method using a "param" tag.
        /// </summary>
        /// <param name="writer">Writer to which code is written to.</param>
        /// <param name="parameter">The definition of the parameter, including name and description.</param>
        /// <returns></returns>
        public CodeWriter WriteXmlDocumentationParameter(Parameter parameter)
        {
            return WriteXmlDocumentationParameter(parameter.Name, parameter.Description);
        }

        public CodeWriter WriteXmlDocumentationException(CSharpType exception, FormattableString? description)
        {
            return WriteDocumentationLines($"<exception cref=\"{exception}\">", $"</exception>", description);
        }

        public CodeWriter WriteXmlDocumentationReturns(FormattableString text)
        {
            return WriteDocumentationLines($"<returns>", $"</returns>", text);
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

        public CodeWriter WriteXmlDocumentationRequiredParametersException(IEnumerable<Parameter> parameters)
        {
            return WriteXmlDocumentationParametersExceptions(typeof(ArgumentNullException), parameters.Where(p => p.Validation is ParameterValidationType.AssertNotNull or ParameterValidationType.AssertNotNullOrEmpty).ToArray(), " is null.");
        }

        public CodeWriter WriteXmlDocumentationNonEmptyParametersException(IEnumerable<Parameter> parameters)
        {
            return WriteXmlDocumentationParametersExceptions(typeof(ArgumentException), parameters.Where(p => p.Validation == ParameterValidationType.AssertNotNullOrEmpty).ToArray(), " is an empty string, and was expected to be non-empty.");
        }

        private CodeWriter WriteXmlDocumentationParametersExceptions(Type exceptionType, IReadOnlyCollection<Parameter> parameters, string reason)
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
            return WriteXmlDocumentationException(exceptionType, description);
        }

        public CodeWriter WriteDocumentationLines(FormattableString startTag, FormattableString endTag, FormattableString? text)
            => AppendXmlDocumentation(startTag, endTag, text ?? $"");

        public CodeWriter WriteMethodDocumentation(MethodSignatureBase methodBase)
        {
            if (methodBase.IsRawSummaryText)
            {
                return WriteRawXmlDocumentation(methodBase.Description);
            }

            if (methodBase.NonDocumentComment is { } comment)
            {
                WriteLine($"// {comment}");
            }

            if (methodBase.SummaryText is { } summaryText)
            {
                WriteXmlDocumentationSummary(summaryText);
            }

            return WriteMethodDocumentationSignature(methodBase);
        }

        public CodeWriter WriteMethodDocumentationSignature(MethodSignatureBase methodBase)
        {
            WriteXmlDocumentationParameters(methodBase.Modifiers.HasFlag(MethodSignatureModifiers.Public) ? methodBase.Parameters : methodBase.Parameters.Where(p => p.Description is not null));

            WriteXmlDocumentationRequiredParametersException(methodBase.Parameters);
            WriteXmlDocumentationNonEmptyParametersException(methodBase.Parameters);
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

        internal CodeWriter WriteRawXmlDocumentation(FormattableString? content)
        {
            if (content is null)
                return this;

            var lines = content.ToString().Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            var xmlLines = string.Join('\n', lines.Select(l => "/// " + l));
            AppendRaw(xmlLines);
            WriteLine();
            return this;
        }

        internal CodeWriter AppendXmlDocumentation(FormattableString startTag, FormattableString endTag, FormattableString content)
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
                    WriteLine();
                }

                return this;
            }

            WriteLine();
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
    }
}
