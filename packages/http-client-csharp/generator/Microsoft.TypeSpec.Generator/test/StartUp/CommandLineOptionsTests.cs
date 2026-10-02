// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CommandLine;
using CommandLine.Text;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.StartUp
{
    internal class CommandLineOptionsTests
    {
        private const string GeneratedFolder = "Generated";

        /// <summary>
        /// Test data for validating parsing different command line options. These test cases simply validate that the parser
        /// does not throw an exception when parsing the command line options.
        /// </summary>
        private static IEnumerable<TestCaseData> TestParseCommandLineOptionsArgsTestData()
        {
            // happy path scenarios
            yield return new TestCaseData(new string[] { "../inputDir", "-g CodeModelGenerator" }, false);
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

        [Test]
        public void TestParseCommandLineOptions_HostedMode()
        {
            var result = Parser.Default.ParseArguments<CommandLineOptions>(
                ["input", "-g", "ScmCodeModelGenerator", "--hosted"]);

            Assert.That(result.Errors, Is.Empty);
            Assert.IsNotNull(result.Value);
            Assert.IsTrue(result.Value.IsHosted);
        }

        [Test]
        public void TestParseCommandLineOptions_HostedModeIsOptIn()
        {
            var result = Parser.Default.ParseArguments<CommandLineOptions>(
                ["input", "-g", "ScmCodeModelGenerator"]);

            Assert.That(result.Errors, Is.Empty);
            Assert.IsFalse(result.Value.IsHosted);
        }

        [TestCase("--help")]
        [TestCase("--unknown-option")]
        public void HostedModeIsHiddenFromHelp(string argument)
        {
            using var parser = new Parser(settings => settings.HelpWriter = null);
            var result = parser.ParseArguments<CommandLineOptions>([argument]);
            var help = HelpText.AutoBuild(result).ToString();

            StringAssert.DoesNotContain("--hosted", help);
            StringAssert.Contains("--generatorName", help);
        }

        [TestCase("--hosted=false")]
        [TestCase("--")]
        [TestCase("ScmCodeModelGenerator --hosted=false")]
        public void TestParseCommandLineOptions_GeneratorNameCannotDisableHostedMode(string generatorName)
        {
            var result = Parser.Default.ParseArguments<CommandLineOptions>(
                ["input", "-g", generatorName, "--new-project", "--hosted"]);

            Assert.IsTrue(result.Errors.Any() || result.Value.IsHosted,
                "A caller-controlled generator name must not produce a successful parse with hosted mode disabled.");
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
                yield return new TestCaseData("./src", $"{Path.Combine(Path.GetFullPath("./src"), GeneratedFolder)}");
                yield return new TestCaseData("../src", $"{Path.Combine(Path.GetFullPath("../src"), GeneratedFolder)}");
                yield return new TestCaseData("./Generated", Path.GetFullPath("./Generated"));
                yield return new TestCaseData("c://Generated", Path.GetFullPath("c://Generated"));
                yield return new TestCaseData("c://src///Generated", Path.GetFullPath("c://src///Generated"));
                yield return new TestCaseData("./myDir", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("./myDir/src", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("./myDir/src/", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("./myDir/src/Generated", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("./myDir/src/Generated/", $"{Path.Combine(Path.GetFullPath("./myDir"), "src", GeneratedFolder)}\\");
                yield return new TestCaseData("c://someDir", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("c://someDir//src", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("c://someDir//src//", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("c://someDir//src//Generated", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", GeneratedFolder)}");
                yield return new TestCaseData("c://someDir//src//Generated//", $"{Path.Combine(Path.GetFullPath("c://someDir"), "src", GeneratedFolder)}\\");
            }
        }
    }
}
