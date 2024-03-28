// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Immutable;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Generation.Writers;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Common.Output.PostProcessing;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.AutoRest.Plugins
{
    internal class LowLevelTarget
    {
        public static async Task ExecuteAsync(GeneratedCodeWorkspace project, InputNamespace inputNamespace, SourceInputModel? sourceInputModel, bool isTspInput)
        {
            var library = new DpgOutputLibraryBuilder(inputNamespace, sourceInputModel).Build(isTspInput);

            foreach (var model in library.AllModels)
            {
                var codeWriter = new CodeWriter();
                var modelWriter = new ModelWriter();
                modelWriter.WriteModel(codeWriter, model);
                var folderPath = Configuration.ModelNamespace ? "Models/" : "";
                project.AddGeneratedFile($"{folderPath}{model.Type.Name}.cs", codeWriter.ToString());

                var serializationCodeWriter = new CodeWriter();
                var serializationWriter = new SerializationWriter();
                serializationWriter.WriteSerialization(serializationCodeWriter, model);
                project.AddGeneratedFile($"{folderPath}{model.Type.Name}.Serialization.cs", serializationCodeWriter.ToString());
            }

            foreach (var client in library.RestClients)
            {
                var dpgClientWriter = new DpgClientWriter(library, client);
                dpgClientWriter.WriteClient();
                project.AddGeneratedFile($"{client.Type.Name}.cs", dpgClientWriter.ToString());

                var sampleProvider = library.GetSampleForClient(client);
                // write samples
                if (sampleProvider != null)
                {
                    var clientExampleFilename = $"../../tests/Generated/Samples/{sampleProvider.Type.Name}.cs";
                    var clientSampleWriter = new CodeWriter();
                    new ExpressionTypeProviderWriter(clientSampleWriter, sampleProvider).Write();
                    project.AddGeneratedTestFile(clientExampleFilename, clientSampleWriter.ToString());
                    project.AddGeneratedDocFile(dpgClientWriter.XmlDocWriter.Filename, new XmlDocumentFile(clientExampleFilename, dpgClientWriter.XmlDocWriter));
                }
            }

            var optionsWriter = new CodeWriter();
            ClientOptionsWriter.WriteClientOptions(optionsWriter, library.ClientOptions);
            project.AddGeneratedFile($"{library.ClientOptions.Type.Name}.cs", optionsWriter.ToString());

            if (Configuration.IsBranded)
            {
                var extensionWriter = new AspDotNetExtensionWriter(library.AspDotNetExtension);
                extensionWriter.Write();
                project.AddGeneratedFile($"{library.AspDotNetExtension.Type.Name}.cs", extensionWriter.ToString());
            }

            var modelFactoryProvider = library.ModelFactory;
            if (modelFactoryProvider != null)
            {
                var modelFactoryWriter = new ModelFactoryWriter(modelFactoryProvider);
                modelFactoryWriter.Write();
                project.AddGeneratedFile($"{modelFactoryProvider.Type.Name}.cs", modelFactoryWriter.ToString());
            }

            if (Configuration.GenerateTestProject)
            {
                if (Configuration.IsBranded)
                {
                    // write test base and test env
                    var testBaseWriter = new CodeWriter();
                    new ExpressionTypeProviderWriter(testBaseWriter, library.DpgTestBase).Write();
                    project.AddGeneratedTestFile($"../../tests/Generated/Tests/{library.DpgTestBase.Type.Name}.cs", testBaseWriter.ToString());

                    var testEnvWriter = new CodeWriter();
                    new ExpressionTypeProviderWriter(testEnvWriter, library.DpgTestEnvironment).Write();
                    project.AddGeneratedTestFile($"../../tests/Generated/Tests/{library.DpgTestEnvironment.Type.Name}.cs", testEnvWriter.ToString());
                }

                // write the client test files
                foreach (var client in library.RestClients)
                {
                    var clientTestProvider = library.GetTestForClient(client);
                    if (clientTestProvider != null)
                    {
                        var clientTestFilename = $"../../tests/Generated/Tests/{clientTestProvider.Type.Name}.cs";
                        var clientTestWriter = new CodeWriter();
                        new ExpressionTypeProviderWriter(clientTestWriter, clientTestProvider).Write();
                        project.AddGeneratedTestFile(clientTestFilename, clientTestWriter.ToString());
                    }
                }
            }

            foreach (var helper in ExpressionTypeProvider.GetHelperProviders())
            {
                var helperWriter = new CodeWriter();
                new ExpressionTypeProviderWriter(helperWriter, helper).Write();
                project.AddGeneratedFile($"Internal/{helper.Type.Name}.cs", helperWriter.ToString());
            }

            await project.PostProcessAsync(new PostProcessor(
                modelsToKeep: library.AccessOverriddenModels.ToImmutableHashSet(),
                modelFactoryFullName: modelFactoryProvider?.FullName,
                aspExtensionClassName: library.AspDotNetExtension.FullName));
        }
    }
}
