using System;
using System.Linq;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.ResourceManager;
using MgmtLRO;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtLROTests : TestProjectTests
    {
        public MgmtLROTests() : base("MgmtLRO") { }

        [TestCase("BarCollection", "CreateOrUpdate", typeof(ArmOperation<BarResource>))]
        [TestCase("FakeCollection", "CreateOrUpdate", typeof(ArmOperation<FakeResource>))]
        public void ValidateLongRunningOperationFunctionInCollection(string className, string functionName, Type returnType)
        {
            var collections = FindAllCollections().First(c => c.Name == className);
            var method = collections.GetMethod(functionName);
            Assert.NotNull(method, $"cannot find {className}.{functionName}");
            Assert.AreEqual(method.ReturnType, returnType, $"method {className}.{functionName} does not return type {returnType}");
        }

        [TestCase("FakeCollection", "CreateOrUpdate")]
        [TestCase("FakeResource", "Update")]
        [TestCase("FakeResource", "DoSomethingLRO")]
        [TestCase("BarResource", "Delete")]
        public void ValidateLROMethods(string className, string methodName)
        {
            ValidateMethods(className, methodName, true);
        }

        public void ValidateMethods(string className, string methodName, bool exist)
        {
            var classesToCheck = FindAllCollections().Concat(FindAllResources());
            var classToCheck = classesToCheck.First(t => t.Name == className);
            var methodInfo = classToCheck.GetMethod(methodName);
            Assert.AreEqual(exist, methodInfo != null, $"can{(exist ? "not" : string.Empty)} find {className}.{methodName}");

            var waitForCompletionParam = methodInfo.GetParameters().Where(P => P.Name == KnownParameters.WaitForCompletion.Name).First();
            Assert.NotNull(waitForCompletionParam);
            Assert.IsEmpty(waitForCompletionParam.DefaultValue.ToString());
        }
    }
}
