// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Types;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using NUnit.Framework;

namespace AutoRest.CSharp.Utilities.Tests
{
    public class NamedTypeSymbolExtensionsTests
    {
        private Compilation _compilation;

        private INamedTypeSymbol _nullableIntSymbol;
        private INamedTypeSymbol _intListSymbol;
        private INamedTypeSymbol _modelSymbol;
        private INamedTypeSymbol _nullableIntListSymbol;

        [OneTimeSetUp]
        public void SetUp()
        {
            // we cannot directly construct the symbols therefore we have to construct them from a segment of source code text below
            var tree = CSharpSyntaxTree.ParseText(@"
using System.Collections.Generic;
namespace NamedTypeSymbolExtensionsTests
{
    public class SourceInputMetadata
    {
        public class MetadataModel
        {
        }
        public void Method(int? nullableInt, List<int> intList, List<int?> nullableIntList, MetadataModel model)
        {
        }
    }
}");
            var corlibLocation = typeof(object).Assembly.Location;
            var references = new List<MetadataReference>
            {
                MetadataReference.CreateFromFile(corlibLocation)
            };
            _compilation = CSharpCompilation.Create("TestCode", syntaxTrees: new[] { tree }, references: references);

            var members = _compilation.GetTypeByMetadataName("NamedTypeSymbolExtensionsTests.SourceInputMetadata").GetMembers();
            foreach (var member in members)
            {
                if (member is IMethodSymbol method && method.Name == "Method")
                {
                    foreach (var parameter in method.Parameters)
                    {
                        switch (parameter.Name)
                        {
                            case "nullableInt":
                                _nullableIntSymbol = (INamedTypeSymbol)parameter.Type;
                                break;
                            case "intList":
                                _intListSymbol = (INamedTypeSymbol)parameter.Type;
                                break;
                            case "model":
                                _modelSymbol = (INamedTypeSymbol)parameter.Type;
                                break;
                            case "nullableIntList":
                                _nullableIntListSymbol = (INamedTypeSymbol)parameter.Type;
                                break;
                            default:
                                throw new InvalidOperationException("unhandled parameter name");
                        }
                    }
                }
            }

            Configuration.Initialize(
                outputFolder: "Generated",
                ns: "",
                libraryName: "",
                sharedSourceFolders: Array.Empty<string>(),
                saveInputs: false,
                azureArm: false,
                publicClients: true,
                modelNamespace: false,
                headAsBoolean: false,
                skipCSProj: false,
                skipCSProjPackageReference: false,
                generation1ConvenienceClient: false,
                singleTopLevelClient: false,
                skipSerializationFormatXml: false,
                disablePaginationTopRenaming: false,
                generateModelFactory: false,
                publicDiscriminatorProperty: false,
                deserializeNullCollectionAsNullValue: false,
                useCoreDataFactoryReplacements: true,
                useModelReaderWriter: true,
                enableBicepSerialization: true,
                modelFactoryForHlc: Array.Empty<string>(),
                unreferencedTypesHandling: Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize,
                keepNonOverloadableProtocolSignature: false,
                projectFolder: "/..",
                existingProjectFolder: null,
                protocolMethodList: Array.Empty<string>(),
                suppressAbstractBaseClasses: Array.Empty<string>(),
                modelsToTreatEmptyStringAsNull: Array.Empty<string>(),
                additionalIntrinsicTypesToTreatEmptyStringAsNull: Array.Empty<string>(),
                shouldTreatBase64AsBinaryData: true,
                methodsToKeepClientDefaultValue: Array.Empty<string>(),
                mgmtConfiguration: null,
                mgmtTestConfiguration: null,
                branded: true,
                generateSampleProject: true,
                generateTestProject: true);
        }

        [Test]
        public void IsSameType_PrimitiveTypes()
        {
            // System.Int32
            INamedTypeSymbol intSymbol = _compilation.GetTypeByMetadataName("System.Int32");
            CSharpType intType = new CSharpType(typeof(int));
            Assert.IsTrue(intSymbol.IsSameType(intType)); // asserts that int == int
            Assert.IsFalse(_nullableIntSymbol.IsSameType(intType)); // asserts that int? != int

            CSharpType nullableIntType = new CSharpType(typeof(int), true);
            Assert.IsTrue(_nullableIntSymbol.IsSameType(nullableIntType)); // asserts that int? == int?
            Assert.IsFalse(intSymbol.IsSameType(nullableIntType)); // asserts that int != int?

            // System.String
            INamedTypeSymbol stringSymbol = _compilation.GetTypeByMetadataName("System.String");
            CSharpType stringType = new CSharpType(typeof(string));
            Assert.IsTrue(stringSymbol.IsSameType(stringType));

            // System.Collections.Generic.List
            CSharpType intListType = new CSharpType(typeof(List<int>));
            CSharpType nullableIntListType = new CSharpType(typeof(List<int?>));
            Assert.IsTrue(_intListSymbol.IsSameType(intListType)); // asserts that List<int> == List<int>
            Assert.IsFalse(_intListSymbol.IsSameType(nullableIntListType)); // asserts that List<int> != List<int?>
            Assert.IsTrue(_nullableIntListSymbol.IsSameType(nullableIntListType)); // asserts that List<int?> == List<int?>
            Assert.IsFalse(_nullableIntListSymbol.IsSameType(intListType)); // asserts that List<int?> != List<int>

            // Mix
            Assert.IsFalse(intSymbol.IsSameType(stringType));
            Assert.IsFalse(intSymbol.IsSameType(intListType));
            Assert.IsFalse(intSymbol.IsSameType(nullableIntListType));
            Assert.IsFalse(stringSymbol.IsSameType(intType));
            Assert.IsFalse(_intListSymbol.IsSameType(intType));
            Assert.IsFalse(_intListSymbol.IsSameType(nullableIntType));
            Assert.IsFalse(stringSymbol.IsSameType(nullableIntType));
            Assert.IsFalse(_nullableIntSymbol.IsSameType(stringType));
            Assert.IsFalse(_nullableIntSymbol.IsSameType(intListType));
            Assert.IsFalse(_nullableIntSymbol.IsSameType(nullableIntListType));
        }

        [Test]
        public void IsSameType_ModelTypes()
        {
            // Different namespace
            var input = new InputModelType("MetadataModel", "", null, null, null, InputModelTypeUsage.RoundTrip, null, null, null, null, null, null, false);
            CSharpType modelType = new CSharpType(new ModelTypeProvider(input, "", null, null));
            Assert.IsFalse(_modelSymbol.IsSameType(modelType));

            // Same namespace
            input = new InputModelType("MetadataModel", "NamedTypeSymbolExtensionsTests", null, null, null, InputModelTypeUsage.RoundTrip, null, null, null, null, null, null, false);
            modelType = new CSharpType(new ModelTypeProvider(input, "NamedTypeSymbolExtensionsTests", null, null));
            Assert.IsTrue(_modelSymbol.IsSameType(modelType));
        }
    }
}
