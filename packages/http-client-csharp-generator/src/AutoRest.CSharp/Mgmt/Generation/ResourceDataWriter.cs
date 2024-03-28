// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal class ResourceDataWriter : ModelWriter
    {
        private ResourceData _resourceData;
        public ResourceDataWriter(ResourceData resourceData)
        {
            _resourceData = resourceData;
        }

        protected override void WriteProperties(CodeWriter writer, ObjectType schema)
        {
            base.WriteProperties(writer, schema);

            if (_resourceData.TypeOfId == null)
            {
                writer.WriteXmlDocumentationSummary($"The resource identifier");
                writer.Line($"public {typeof(Azure.Core.ResourceIdentifier)} Id {{ get; internal set; }}");
            }
        }
    }
}
