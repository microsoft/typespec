// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using AutoRest.CSharp.AutoRest.Communication;
using AutoRest.CSharp.AutoRest.Plugins;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using Azure;
using Azure.ResourceManager;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.OutputLibrary
{
    [Parallelizable(ParallelScope.None)]
    internal abstract class OutputLibraryTestBase
    {
        private string _projectName;
        private string? _subFolder;

        public OutputLibraryTestBase(string projectName, string subFolder = null)
        {
            _projectName = projectName;
            _subFolder = subFolder;
        }

        [OneTimeSetUp]
        public async Task Generate()
        {
            var basePath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            if (_subFolder is null)
            {
                basePath = Path.Combine(basePath.Substring(0, basePath.IndexOf("autorest.csharp")), "autorest.csharp", "test", "TestProjects", _projectName, "Generated");
            }
            else
            {
                basePath = Path.Combine(basePath.Substring(0, basePath.IndexOf("autorest.csharp")), "autorest.csharp", "test", "TestProjects", _projectName, _subFolder, "Generated");
            }

            StandaloneGeneratorRunner.LoadConfiguration(null, basePath, null, File.ReadAllText(Path.Combine(basePath, "Configuration.json")));
            var codeModelTask = Task.Run(() => CodeModelSerialization.DeserializeCodeModel(File.ReadAllText(Path.Combine(basePath, "CodeModel.yaml"))));
            var project = await GeneratedCodeWorkspace.Create(Configuration.AbsoluteProjectFolder, Configuration.OutputFolder, Configuration.SharedSourceFolders);
            var sourceInputModel = new SourceInputModel(await project.GetCompilationAsync());
            var model = await codeModelTask;
            MgmtContext.Initialize(new BuildContext<MgmtOutputLibrary>(model, sourceInputModel));
        }

        [Test]
        public void ValidateRequiredParamsInCtor()
        {
            if (_projectName.Equals("") || _projectName.Equals("ReferenceTypes"))
            {
                return;
            }

            foreach (var mgmtObject in MgmtContext.Library.Models.OfType<MgmtObjectType>())
            {
                if (ReferenceTypePropertyChooser.GetExactMatch(mgmtObject) == null)
                {
                    ValidateModelRequiredCtorParams(mgmtObject.ObjectSchema, mgmtObject.Type.Name);
                }
            }
            foreach (var resourceData in MgmtContext.Library.ResourceData)
            {
                ValidateModelRequiredCtorParams(resourceData.ObjectSchema, resourceData.Type.Name);
            }
        }

        private void ValidateModelRequiredCtorParams(ObjectSchema objectSchema, string typeName)
        {
            var requiredParams = objectSchema.Properties.Where(p => p.Schema is not ConstantSchema && p.Required.HasValue && p.Required.Value);

            Type generatedModel = Assembly.GetExecutingAssembly().GetType(typeName);
            if (generatedModel == null)
                return; //for some reason we are losing the cache during generation to know which models were removed
            Assert.NotNull(generatedModel, $"Generated type not found for {objectSchema.Name}");
            ConstructorInfo leastParamCtor = GetLeastParamCtor(generatedModel);
            ConstructorInfo baseLeastParamCtor = GetLeastParamCtor(generatedModel.BaseType);
            var fullRequiredParams = requiredParams.Select(p => p.SerializedName).Concat(baseLeastParamCtor?.GetParameters().Select(p => p.Name)).Distinct();
            Assert.NotNull(leastParamCtor, $"Ctor not found for {objectSchema.Name}");
            Assert.AreEqual(fullRequiredParams.Count(), leastParamCtor.GetParameters().Length, $"{objectSchema.Name} had a mismatch in required ctor params");
            foreach (var param in fullRequiredParams)
            {
                Assert.NotNull(leastParamCtor.GetParameters().FirstOrDefault(p => string.Equals(p.Name, param, StringComparison.InvariantCultureIgnoreCase)), $"{param} was not found in {objectSchema.Name}'s ctor");
            }
        }

        private bool HasInitializationAttribute(ConstructorInfo c)
        {
            return c.GetCustomAttributes(false).Any(c => c.GetType().Name == ReferenceClassFinder.InitializationCtorAttributeName);
        }

        private ConstructorInfo GetLeastParamCtor(Type generatedModel)
        {
            ConstructorInfo leastParamCtor = null;

            if (generatedModel == null)
                return leastParamCtor;

            if (generatedModel.GetCustomAttributes(false).Any(a => a.GetType().Name == ReferenceClassFinder.ReferenceTypeAttributeName))
            {
                var ctors = generatedModel.GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
                var attrCtors = ctors.Where(c => HasInitializationAttribute(c));
                return attrCtors.FirstOrDefault();
            }

            foreach (var ctor in generatedModel.GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public))
            {
                if (ctor.GetParameters().Length < (leastParamCtor == null ? int.MaxValue : leastParamCtor.GetParameters().Length))
                    leastParamCtor = ctor;
            }
            return leastParamCtor;
        }

        [Test]
        public void ValidateResourceDataCount()
        {
            var count = MgmtContext.Library.ResourceSchemaMap.Count;

            Assert.AreEqual(count, MgmtContext.Library.ResourceData.Count(), "Did not find the expected resourceData count");
        }

        [TestCase("Delete")]
        [TestCase("DeleteAsync")]
        public void ValidateDeleteMethodAsLRO(string methodName)
        {
            foreach (var resource in MgmtContext.Library.ArmResources)
            {
                var name = $"{_projectName}.{resource.Type.Name}";
                var generatedResourceType = Assembly.GetExecutingAssembly().GetType(name);
                Assert.NotNull(generatedResourceType, $"class {name} is not found in {MgmtContext.RPName}");
                if (IsSingletonOperation(generatedResourceType) || resource is PartialResource)
                {
                    continue;
                }

                var deleteOperation = resource.DeleteOperation;
                if (deleteOperation != null)
                {
                    var method = generatedResourceType.GetMethod(methodName);
                    Assert.NotNull(method, $"{generatedResourceType.Name} does not implement the {methodName} method.");

                    Assert.GreaterOrEqual(method.GetParameters().Length, 2);
                    TypeAsserts.HasParameter(method, KnownParameters.WaitForCompletion.Name, typeof(WaitUntil));
                    TypeAsserts.HasParameter(method, KnownParameters.CancellationTokenParameter.Name, typeof(CancellationToken));
                }
            }
        }

        [TestCase("Get")]
        [TestCase("GetAsync")]
        public void ValidateGetOverloadMethod(string methodName)
        {
            foreach (var resource in MgmtContext.Library.ArmResources)
            {
                var name = $"{_projectName}.{resource.Type.Name}";
                var generatedResourceType = Assembly.GetExecutingAssembly().GetType(name);
                Assert.NotNull(generatedResourceType, $"class {name} is not found");
                if (IsSingletonOperation(generatedResourceType) || resource is PartialResource)
                {
                    continue;
                }

                var getOperation = resource.GetOperation;
                Assert.NotNull(getOperation);
                var method = generatedResourceType.GetMethod(methodName);
                Assert.NotNull(method, $"{generatedResourceType.Name} does not implement the {methodName} method.");
            }
        }

        [Test]
        public void ValidateEnumerable()
        {
            foreach (var collection in MgmtContext.Library.ResourceCollections)
            {
                // skip this if this collection is in the list-exception configuration
                if (Configuration.MgmtConfiguration.ListException.Contains(collection.RequestPath))
                    continue;
                var name = $"{_projectName}.{collection.Type.Name}";
                var generatedCollectionType = Assembly.GetExecutingAssembly().GetType(name);
                Assert.NotNull(generatedCollectionType, $"Type ({name}) was not found.");

                Assert.NotNull(generatedCollectionType.GetInterface("IEnumerable"), $"{generatedCollectionType.Name} did not implement IEnumerable");
                Assert.NotNull(generatedCollectionType.GetInterface("IEnumerable`1"), $"{generatedCollectionType.Name} did not implement IEnumerable<T>");

                // see if this collection has a Pageable GetAll operation
                // first find the GetAll method without required parameters
                var getAllMethods = generatedCollectionType.GetMethods().Where(method => method.Name == "GetAll")
                    .Where(method => method.GetParameters().Where(p => !p.HasDefaultValue).Count() == 0);
                var getAllMethod = getAllMethods.SingleOrDefault();
                Assert.NotNull(getAllMethod, $"{collection.Type.Name} should have a GetAll operation");
                if (getAllMethod.ReturnType.Name == typeof(Azure.Pageable<>).Name)
                {
                    Assert.NotNull(generatedCollectionType.GetInterface("IAsyncEnumerable`1"), $"{generatedCollectionType.Name} did not implement IAsyncEnumerable<T>");
                }
            }
        }

        private bool IsSingletonOperation(Type type)
        {
            var propertyInfo = type.GetProperty("Parent", BindingFlags.Instance | BindingFlags.Public);
            if (propertyInfo == null)
                return false;
            return type.BaseType == typeof(ArmResource) && propertyInfo.PropertyType == typeof(ArmResource);
        }
    }
}
