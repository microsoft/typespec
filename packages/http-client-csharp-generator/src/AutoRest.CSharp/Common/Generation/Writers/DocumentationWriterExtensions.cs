// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using static AutoRest.CSharp.Output.Models.Shared.ValidationType;

namespace AutoRest.CSharp.Generation.Writers
{
    internal static class DocumentationWriterExtensions
    {
        private static readonly char[] _newLineChars = { '\r', '\n' };

        public static CodeWriter WriteXmlDocumentationInheritDoc(this CodeWriter writer, CSharpType? crefType = null)
            => crefType == null
                ? writer.Line($"/// <inheritdoc />")
                : writer.Line($"/// <inheritdoc cref=\"{crefType}\"/>");

        public static CodeWriter WriteXmlDocumentationSummary(this CodeWriter writer, FormattableString? text)
        {
            return writer.WriteXmlDocumentation("summary", text);
        }

        public static CodeWriter WriteXmlDocumentation(this CodeWriter writer, string tag, FormattableString? text)
        {
            return writer.WriteDocumentationLines($"<{tag}>", $"</{tag}>", text);
        }

        public static CodeWriter WriteXmlDocumentationParameters(this CodeWriter writer, IEnumerable<Parameter> parameters)
        {
            foreach (var parameter in parameters)
            {
                writer.WriteXmlDocumentationParameter(parameter);
            }

            return writer;
        }

        public static CodeWriter WriteXmlDocumentationParameter(this CodeWriter writer, string name, FormattableString? text)
        {
            return writer.WriteDocumentationLines($"<param name=\"{name}\">", $"</param>", text);
        }

        /// <summary>
        /// Writes XML documentation for a parameter of a method using a "param" tag.
        /// </summary>
        /// <param name="writer">Writer to which code is written to.</param>
        /// <param name="parameter">The definition of the parameter, including name and description.</param>
        /// <returns></returns>
        public static CodeWriter WriteXmlDocumentationParameter(this CodeWriter writer, Parameter parameter)
        {
            return writer.WriteXmlDocumentationParameter(parameter.Name, parameter.Description);
        }

        public static CodeWriter WriteXmlDocumentationException(this CodeWriter writer, CSharpType exception, FormattableString? description)
        {
            return writer.WriteDocumentationLines($"<exception cref=\"{exception}\">", $"</exception>", description);
        }

        public static CodeWriter WriteXmlDocumentationReturns(this CodeWriter writer, FormattableString text)
        {
            return writer.WriteDocumentationLines($"<returns>", $"</returns>", text);
        }

        public static CodeWriter WriteXmlDocumentationInclude(this CodeWriter writer, string filename, MethodSignature methodSignature, out string memberId)
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
            return writer.LineRaw($"/// <include file=\"{filename}\" path=\"doc/members/member[@name='{memberId}']/*\" />");
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

        public static CodeWriter WriteXmlDocumentationRequiredParametersException(this CodeWriter writer, IEnumerable<Parameter> parameters)
        {
            return writer.WriteXmlDocumentationParametersExceptions(typeof(ArgumentNullException), parameters.Where(p => p.Validation is AssertNotNull or AssertNotNullOrEmpty).ToArray(), " is null.");
        }

        public static CodeWriter WriteXmlDocumentationNonEmptyParametersException(this CodeWriter writer, IEnumerable<Parameter> parameters)
        {
            return writer.WriteXmlDocumentationParametersExceptions(typeof(ArgumentException), parameters.Where(p => p.Validation == AssertNotNullOrEmpty).ToArray(), " is an empty string, and was expected to be non-empty.");
        }

        private static CodeWriter WriteXmlDocumentationParametersExceptions(this CodeWriter writer, Type exceptionType, IReadOnlyCollection<Parameter> parameters, string reason)
        {
            if (parameters.Count == 0)
            {
                return writer;
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
            return writer.WriteXmlDocumentationException(exceptionType, description);
        }

        public static CodeWriter WriteDocumentationLines(this CodeWriter writer, FormattableString startTag, FormattableString endTag, FormattableString? text)
            => writer.AppendXmlDocumentation(startTag, endTag, text ?? $"");
    }
}
