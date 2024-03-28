// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.MgmtTest.AutoRest;
using AutoRest.CSharp.MgmtTest.Generation.Mock;
using AutoRest.CSharp.MgmtTest.Generation.Samples;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.AutoRest.Plugins
{
    internal class MgmtTestTarget
    {
        private const string SOURCE_DEFAULT_FOLDER_NAME = "src";
        private const string SOURCE_DEFAULT_OUTPUT_PATH = $"/{SOURCE_DEFAULT_FOLDER_NAME}/Generated";
        private const string MOCK_TEST_DEFAULT_OUTPUT_PATH = "/tests/Generated";
        private const string SAMPLE_DEFAULT_OUTPUT_PATH = "/samples/Generated";

        public static async Task ExecuteAsync(GeneratedCodeWorkspace project, CodeModel codeModel, SourceInputModel? sourceInputModel)
        {
            Debug.Assert(codeModel.TestModel is not null);
            Debug.Assert(Configuration.MgmtTestConfiguration is not null);

            MgmtTestOutputLibrary library;
            if (sourceInputModel == null)
            {
                var sourceFolder = GetSourceFolder();
                var sourceCodeProject = new SourceCodeProject(sourceFolder, Configuration.SharedSourceFolders);
                sourceInputModel = new SourceInputModel(await sourceCodeProject.GetCompilationAsync());
                InitializeMgmtContext(codeModel, sourceInputModel);
                library = new MgmtTestOutputLibrary(codeModel, sourceInputModel);
                project.AddDirectory(sourceFolder);
            }
            else
            {
                library = new MgmtTestOutputLibrary(codeModel, sourceInputModel);
            }

            if (Configuration.MgmtTestConfiguration.Mock)
            {
                WriteMockTests(project, library);
            }

            if (Configuration.MgmtTestConfiguration.Sample)
            {
                WriteSamples(project, library);
            }

            if (_overriddenProjectFilenames.TryGetValue(project, out var overriddenFilenames))
                throw new InvalidOperationException($"At least one file was overridden during the generation process. Filenames are: {string.Join(", ", overriddenFilenames)}");

            if (Configuration.MgmtTestConfiguration.ClearOutputFolder)
            {
                ClearOutputFolder();
            }
        }

        private static void InitializeMgmtContext(CodeModel codeModel, SourceInputModel sourceInputModel)
        {
            MgmtContext.Initialize(new BuildContext<MgmtOutputLibrary>(codeModel, sourceInputModel));

            // force trigger the model initialization
            foreach (var _ in MgmtContext.Library.ResourceSchemaMap)
            {
            }
        }

        private static void WriteMockTests(GeneratedCodeWorkspace project, MgmtTestOutputLibrary library)
        {
            string outputFolder = GetOutputFolder(MOCK_TEST_DEFAULT_OUTPUT_PATH);

            // write the collection mock tests
            foreach (var collectionTest in library.ResourceCollectionMockTests)
            {
                var collectionTestWriter = new ResourceCollectionMockTestWriter(collectionTest);
                collectionTestWriter.Write();

                AddGeneratedFile(project, Path.Combine(outputFolder, $"Mock/{collectionTest.Type.Name}.cs"), collectionTestWriter.ToString());
            }

            foreach (var resourceTest in library.ResourceMockTests)
            {
                var resourceTestWriter = new ResourceMockTestWriter(resourceTest);
                resourceTestWriter.Write();

                AddGeneratedFile(project, Path.Combine(outputFolder, $"Mock/{resourceTest.Type.Name}.cs"), resourceTestWriter.ToString());
            }

            var extensionWrapperTest = library.ExtensionWrapperMockTest;
            var extensionWrapperTestWriter = new ExtensionWrapMockTestWriter(extensionWrapperTest, library.ExtensionMockTests);
            extensionWrapperTestWriter.Write();

            AddGeneratedFile(project, Path.Combine(outputFolder, $"Mock/{extensionWrapperTest.Type.Name}.cs"), extensionWrapperTestWriter.ToString());
        }

        private static void WriteSamples(GeneratedCodeWorkspace project, MgmtTestOutputLibrary library)
        {
            string outputFolder = GetOutputFolder(SAMPLE_DEFAULT_OUTPUT_PATH);

            var names = new Dictionary<string, int>();
            foreach (var sample in library.Samples)
            {
                var sampleWriter = new MgmtSampleWriter(sample);
                sampleWriter.Write();

                var filename = GetFilename(sample.Type.Name, names);
                AddGeneratedFile(project, Path.Combine(outputFolder, $"Samples/{filename}.cs"), sampleWriter.ToString());
            }
        }

        private static string GetFilename(string name, Dictionary<string, int> names)
        {
            if (names.TryGetValue(name, out var count))
            {
                names[name]++;
                return $"{name}{count}";
            }

            names[name] = 1;
            return name;
        }

        private static void ClearOutputFolder()
        {
            if (Configuration.MgmtTestConfiguration == null ||
                string.IsNullOrEmpty(Configuration.MgmtTestConfiguration.OutputFolder))
                return;
            DirectoryInfo di = new DirectoryInfo(Configuration.MgmtTestConfiguration.OutputFolder);
            ClearFolder(di);
        }

        private static void ClearFolder(DirectoryInfo di)
        {
            if (di.Exists)
            {
                foreach (FileInfo fi in di.EnumerateFiles())
                {
                    try
                    {
                        fi.Delete();
                    }
                    // Ignore the error from clearing folder
                    catch { }
                }
                foreach (DirectoryInfo subFolder in di.EnumerateDirectories())
                {
                    ClearFolder(subFolder);
                    try
                    {
                        subFolder.Delete();
                    }
                    // Ignore the error from clearing folder
                    catch { }
                }
            }
        }

        private static string GetOutputFolder(string defaultOutputPath)
        {
            if (!string.IsNullOrEmpty(Configuration.MgmtTestConfiguration?.OutputFolder))
                return Configuration.MgmtTestConfiguration.OutputFolder;

            string folder = FormatPath(Configuration.OutputFolder);
            // if the output folder is not given explicitly, try to figure it out from general output folder if possible according to default folder structure:
            // Azure.ResourceManager.XXX \ src \ Generated <- default sdk source output folder
            //                           \ samples(or tests) \ Generated <- default sample output folder defined in msbuild
            if (folder.EndsWith(SOURCE_DEFAULT_OUTPUT_PATH, StringComparison.InvariantCultureIgnoreCase))
                return FormatPath(Path.Combine(folder, $"../..", defaultOutputPath));
            else if (folder.EndsWith(SAMPLE_DEFAULT_OUTPUT_PATH, StringComparison.InvariantCultureIgnoreCase) || folder.EndsWith(MOCK_TEST_DEFAULT_OUTPUT_PATH, StringComparison.InvariantCultureIgnoreCase))
                return folder;
            else
                throw new InvalidOperationException("'sample-gen.output-folder' is not configured and can't figure it out from give general output-folder");
        }

        private static string GetSourceFolder()
        {
            if (!string.IsNullOrEmpty(Configuration.MgmtTestConfiguration?.SourceCodePath))
                return Configuration.MgmtTestConfiguration.SourceCodePath;

            string folder = FormatPath(Configuration.OutputFolder);
            string testFolder = FormatPath(Configuration.MgmtTestConfiguration?.OutputFolder);

            if (!string.IsNullOrEmpty(Configuration.MgmtTestConfiguration?.OutputFolder) &&
               !string.Equals(folder, testFolder, StringComparison.InvariantCultureIgnoreCase))
            {
                // if the general output folder and our output folder is different, the general output folder should point to the sdk code folder src\Generated
                return FormatPath(Path.Combine(Configuration.OutputFolder, ".."));
            }

            // if only the general output folder is given or it's the same as our output folder. Let's try to figure it out from given output folder if possible according to default folder structure:
            // Azure.ResourceManager.XXX \ src <- default sdk source folder
            //                           \ samples(or tests) \ Generated <- default sample output folder defined in msbuild
            if (folder.EndsWith(SOURCE_DEFAULT_OUTPUT_PATH, StringComparison.InvariantCultureIgnoreCase))
                return FormatPath(Path.Combine(folder, ".."));
            else if (folder.EndsWith(SAMPLE_DEFAULT_OUTPUT_PATH, StringComparison.InvariantCultureIgnoreCase) || folder.EndsWith(MOCK_TEST_DEFAULT_OUTPUT_PATH, StringComparison.InvariantCultureIgnoreCase))
                return FormatPath(Path.Combine(folder, "../..", SOURCE_DEFAULT_FOLDER_NAME));
            else
                throw new InvalidOperationException("'sample-gen.source-path' is not configured and can't figure it out from give output-folder and sample-gen.output-folder");
        }

        private static string FormatPath(string? path)
        {
            if (string.IsNullOrEmpty(path))
                return path ?? "";
            return Path.GetFullPath(path.TrimEnd('/', '\\')).Replace("\\", "/");
        }

        private static IDictionary<GeneratedCodeWorkspace, ISet<string>> _addedProjectFilenames = new Dictionary<GeneratedCodeWorkspace, ISet<string>>();
        private static IDictionary<GeneratedCodeWorkspace, IList<string>> _overriddenProjectFilenames = new Dictionary<GeneratedCodeWorkspace, IList<string>>();

        private static void AddGeneratedFile(GeneratedCodeWorkspace project, string filename, string text)
        {
            if (!_addedProjectFilenames.TryGetValue(project, out var addedFileNames))
            {
                addedFileNames = new HashSet<string>();
                _addedProjectFilenames.Add(project, addedFileNames);
            }
            if (addedFileNames.Contains(filename))
            {
                if (!_overriddenProjectFilenames.TryGetValue(project, out var overriddenFileNames))
                {
                    overriddenFileNames = new List<string>();
                    _overriddenProjectFilenames.Add(project, overriddenFileNames);
                }
                overriddenFileNames.Add(filename);
            }
            else
            {
                addedFileNames.Add(filename);
            }
            project.AddGeneratedFile(filename, text);
        }
    }
}
