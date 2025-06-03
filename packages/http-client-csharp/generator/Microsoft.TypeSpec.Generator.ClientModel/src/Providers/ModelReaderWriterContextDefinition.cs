// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal class ModelReaderWriterContextDefinition : TypeProvider
    {
        internal static string s_name = $"{RemovePeriods(ScmCodeModelGenerator.Instance.TypeFactory.PrimaryNamespace)}Context";

        protected override string BuildName() => s_name;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [typeof(ModelReaderWriterContext)];

        protected override XmlDocProvider BuildXmlDocs()
        {
            var summary = new Statements.XmlDocSummaryStatement(
            [
                $"Context class which will be filled in by the System.ClientModel.SourceGeneration.",
                $"For more information <see href='https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/System.ClientModel/src/docs/ModelReaderWriterContext.md' />"
            ]);
            var xmlDocs = new XmlDocProvider(summary: summary);
            return xmlDocs;
        }

        private static string RemovePeriods(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            Span<char> buffer = stackalloc char[input.Length];
            int index = 0;

            foreach (char c in input)
            {
                if (c != '.')
                    buffer[index++] = c;
            }

            return buffer.Slice(0, index).ToString();
        }
    }
}
