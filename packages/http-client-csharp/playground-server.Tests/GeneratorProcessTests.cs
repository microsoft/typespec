// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using PlaygroundServer;

namespace PlaygroundServer.Tests;

[TestFixture]
public class GeneratorProcessTests
{
    [Test]
    public void CreateStartInfo_AlwaysEnablesHostedMode()
    {
        var startInfo = GeneratorProcess.CreateStartInfo("generator.dll", "output", "ScmCodeModelGenerator");

        Assert.That(startInfo.FileName, Is.EqualTo("dotnet"));
        Assert.That(startInfo.ArgumentList, Is.EqualTo(new[]
        {
            "--roll-forward", "Major", "generator.dll", "output",
            "-g", "ScmCodeModelGenerator", "--new-project", "--hosted",
        }));
        Assert.IsFalse(startInfo.UseShellExecute);
        Assert.IsTrue(startInfo.RedirectStandardOutput);
        Assert.IsTrue(startInfo.RedirectStandardError);
        Assert.IsTrue(startInfo.CreateNoWindow);
        Assert.That(startInfo.Arguments, Is.Empty);
    }

    [TestCase("--hosted=false")]
    [TestCase("--")]
    [TestCase("ScmCodeModelGenerator --hosted=false")]
    public void CreateStartInfo_KeepsGeneratorNameAsOneArgument(string generatorName)
    {
        var startInfo = GeneratorProcess.CreateStartInfo("generator path.dll", "output directory", generatorName);

        Assert.That(startInfo.ArgumentList, Has.Count.EqualTo(8));
        Assert.That(startInfo.ArgumentList[2], Is.EqualTo("generator path.dll"));
        Assert.That(startInfo.ArgumentList[3], Is.EqualTo("output directory"));
        Assert.That(startInfo.ArgumentList[5], Is.EqualTo(generatorName));
        Assert.That(startInfo.ArgumentList[7], Is.EqualTo("--hosted"));
    }
}
