// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CommandLine;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class CommandLineOptionsTests
    {

        /// <summary>
        /// Test data for validating parsing different command line options. These test cases simply validate that the parser
        /// does not throw an exception when parsing the command line options.
        /// </summary>
        private static IEnumerable<TestCaseData> TestParseCommandLineOptionsArgsTestData()
        {
            // happy path scenarios
            yield return new TestCaseData(new string[] { "../inputDir" }, false);
        }

        // Validates parsing different command line options
        [TestCaseSource(nameof(TestParseCommandLineOptionsArgsTestData))]
        public void TestParseCommandLineOptionsArgs(string[] args, bool producesError)
        {
            var result = Parser.Default.ParseArguments<CommandLineOptions>(args);
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Value);

            Assert.IsTrue(result.Errors.Count() == 0);
        }

        public static IEnumerable<TestCaseData> GetConfigurationInputFilePathTestCases
        {
            get
            {
                yield return new TestCaseData(new CommandLineOptions
                {
                    OutputDirectory = "../myDir",
                }, Path.Combine("../myDir", "Configuration.json"));
            }
        }

        public static IEnumerable<TestCaseData> ParseInputPathTestCases
        {
            get
            {
                yield return new TestCaseData("./src", $"{Path.Combine(Path.GetFullPath("./src"), Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("../src", $"{Path.Combine(Path.GetFullPath("../src"), Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("./Generated", Path.GetFullPath("./Generated"));
                yield return new TestCaseData("c://Generated", Path.GetFullPath("c://Generated"));
                yield return new TestCaseData("c://src///Generated", Path.GetFullPath("c://src///Generated"));
                yield return new TestCaseData("./myDir", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("./myDir/src", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("./myDir/src/", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("./myDir/src/Generated", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("./myDir/src/Generated/", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", Constants.DefaultGeneratedCodeFolderName)}\\");
                yield return new TestCaseData("c://someDir", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("c://someDir//src", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("c://someDir//src//", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("c://someDir//src//Generated", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", Constants.DefaultGeneratedCodeFolderName)}");
                yield return new TestCaseData("c://someDir//src//Generated//", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", Constants.DefaultGeneratedCodeFolderName)}\\");
            }
        }
    }
}
