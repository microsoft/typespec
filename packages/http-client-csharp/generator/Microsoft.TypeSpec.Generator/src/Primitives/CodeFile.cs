// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public class CodeFile
    {
        internal CodeFile(string content, string name, string? qualifiedContent = null, SourceConsumptionReceipt? sourceConsumption = null)
        {
            Name = name;
            Content = content;
            QualifiedContent = qualifiedContent;
            SourceConsumption = sourceConsumption;
        }

        public string Name { get; }

        public string Content { get; }

        internal string? QualifiedContent { get; }
        internal SourceConsumptionReceipt? SourceConsumption { get; }

        internal CodeFile WithoutPreparedNames() => QualifiedContent is null ? this : new CodeFile(QualifiedContent, Name, sourceConsumption: SourceConsumption);
    }
}
