using System.Reflection;
using System.Threading;
using AutoRest.CSharp.Output.Models.Shared;
using Azure;
using MgmtOperations.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtOperationsTests : TestProjectTests
    {
        public MgmtOperationsTests() : base("MgmtOperations") { }

        [TestCase("TestSetSharedKey")]
        [TestCase("TestSetSharedKeyAsync")]
        public void ValidatePutMethod(string methodName)
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtOperations.AvailabilitySetResource");
            var method = resourceOpreations.GetMethod(methodName);
            Assert.NotNull(method, $"{resourceOpreations.Name} does not implement the {methodName} method.");

            Assert.AreEqual(3, method.GetParameters().Length);
            var param1 = TypeAsserts.HasParameter(method, "connectionSharedKey", typeof(ConnectionSharedKey));
            Assert.False(param1.IsOptional);
            TypeAsserts.HasParameter(method, KnownParameters.WaitForCompletion.Name, typeof(WaitUntil));
            TypeAsserts.HasParameter(method, KnownParameters.CancellationTokenParameter.Name, typeof(CancellationToken));
        }

        [TestCase(true, "AvailabilitySetResource", "Update")]
        [TestCase(true, "AvailabilitySetResource", "UpdateAsync")]
        [TestCase(true, "UnpatchableResource", "Update")]
        [TestCase(true, "UnpatchableResource", "UpdateAsync")]
        public void ValidateMethod(bool exist, string className, string methodName)
        {
            var resource = Assembly.GetExecutingAssembly().GetType($"MgmtOperations.{className}");
            Assert.NotNull(resource, $"Class {className} not found");

            var method = resource.GetMethod(methodName);
            Assert.AreEqual(exist, method != null, $"Method {methodName} should {(exist ? string.Empty : "not")} exist on class {className}");
        }
    }
}
