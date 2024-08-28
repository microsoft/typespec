// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelProviders
{
    public class ModelCustomizationTests
    {
        // Validates that the property body's setter is correctly set based on the property type
        [TestCase]
        public void TestCustomization_CanChangeModelName()
        {
            SyntaxTree syntaxTree = CSharpSyntaxTree.ParseText(_customizationCode);
            CSharpCompilation compilation = CSharpCompilation.Create("ExistingCode")
                .WithOptions(new CSharpCompilationOptions(OutputKind.ConsoleApplication))
                .AddReferences(MetadataReference.CreateFromFile(typeof(object).Assembly.Location))
                .AddSyntaxTrees(syntaxTree);
            MockHelpers.LoadMockPlugin(customization: compilation);

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            Assert.AreEqual("CustomizedModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace.Models", modelTypeProvider.Type.Namespace);
        }

        private const string _customizationCode = @"#nullable disable

using System;

namespace NewNamespace
{
    [AttributeUsage(AttributeTargets.Class)]
    internal class CodeGenTypeAttribute : Attribute
    {
        public string OriginalName { get; }

        public CodeGenTypeAttribute(string originalName)
        {
            OriginalName = originalName;
        }
    }
}
namespace NewNamespace.Models
{
    [CodeGenType(""MockInputModel"")]
    public partial class CustomizedModel
    {
    }
}
";
    }
}
