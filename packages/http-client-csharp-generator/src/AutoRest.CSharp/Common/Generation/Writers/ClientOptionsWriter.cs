// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class ClientOptionsWriter
    {
        public static void WriteClientOptions(CodeWriter writer, ClientOptionsTypeProvider clientOptions)
        {
            using (writer.Namespace(clientOptions.Type.Namespace))
            {
                writer.WriteXmlDocumentationSummary(clientOptions.Description);
                using (writer.Scope($"{clientOptions.Declaration.Accessibility} partial class {clientOptions.Type.Name}: {Configuration.ApiTypes.ClientOptionsType}"))
                {
                    if (clientOptions.ApiVersions?.Count > 0)
                    {
                        writer.Line($"private const ServiceVersion LatestVersion = ServiceVersion.{clientOptions.ApiVersions.Last().Name};");
                        writer.Line();
                        writer.WriteXmlDocumentationSummary($"The version of the service to use.");
                        using (writer.Scope($"public enum ServiceVersion"))
                        {
                            foreach (var apiVersion in clientOptions.ApiVersions)
                            {
                                writer.WriteXmlDocumentationSummary($"{apiVersion.Description}");
                                writer.Line($"{apiVersion.Name} = {apiVersion.Value:L},");
                            }
                        }
                        writer.Line();

                        writer.Line($"internal string Version {{ get; }}");
                        writer.Line();

                        writer.WriteXmlDocumentationSummary($"Initializes new instance of {clientOptions.Type.Name}.");
                        using (writer.Scope($"public {clientOptions.Type.Name}(ServiceVersion version = LatestVersion)"))
                        {
                            writer.Append($"Version = version ");
                            using (writer.Scope($"switch", end: "};"))
                            {
                                foreach (var apiVersion in clientOptions.ApiVersions)
                                {
                                    writer.Line($"ServiceVersion.{apiVersion.Name} => {apiVersion.StringValue:L},");
                                }

                                writer.Line($"_ => throw new {typeof(NotSupportedException)}()");
                            }
                        }

                        writer.Line();
                    }

                    foreach (var parameter in clientOptions.AdditionalParameters)
                    {
                        writer.WriteXmlDocumentationSummary(parameter.Description);
                        writer.Line($"public {parameter.Type} {parameter.Name.ToCleanName()} {{ get; set; }}");
                        writer.Line();
                    }
                }
            }
        }
    }
}
