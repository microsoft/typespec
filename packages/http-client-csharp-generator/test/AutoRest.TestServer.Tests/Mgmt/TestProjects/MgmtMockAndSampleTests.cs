using System;
using System.Collections.Generic;
using NUnit.Framework;
using MgmtMockAndSample;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtMockAndSampleTests : TestProjectTests
    {
        public MgmtMockAndSampleTests() : base("MgmtMockAndSample", "tests") { }

        protected override HashSet<Type> ListExceptionCollections { get; } = new HashSet<Type>() { typeof(DeletedManagedHsmCollection), typeof(DeletedVaultCollection) };

        [TestCase("CreateOrUpdate")]
        [TestCase("Get")]
        [TestCase("GetAll")]
        public void ValidateMhsmPrivateEndpointConnectionCollectionMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.MhsmPrivateEndpointConnectionCollectionMockTests", methodName, argTypes);
        }

        [TestCase("CreateOrUpdate")]
        [TestCase("Get")]
        [TestCase("GetAll")]
        public void ValidateManagedHsmCollectionMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.ManagedHsmCollectionMockTests", methodName, argTypes);
        }

        [TestCase("CreateOrUpdate")]
        [TestCase("Get")]
        [TestCase("GetAll")]
        public void ValidatePrivateEndpointConnectionCollectionMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.MgmtMockAndSamplePrivateEndpointConnectionCollectionMockTests", methodName, argTypes);
        }

        [TestCase("CreateOrUpdate_CreateANewVaultOrUpdateAnExistingVault")]
        [TestCase("CreateOrUpdate_CreateOrUpdateAVaultWithNetworkAcls")]
        [TestCase("Get")]
        [TestCase("GetAll")]
        public void ValidateVaultCollectionMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.VaultCollectionMockTests", methodName, argTypes);
        }

        [TestCase("Get")]
        [TestCase("Delete")]
        [TestCase("Update")]
        [TestCase("GetMHSMPrivateLinkResourcesByMhsmResource")]
        public void ValidateManagedHsmResourceMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.ManagedHsmResourceMockTests", methodName, argTypes);
        }

        [TestCase("Get")]
        [TestCase("Delete")]
        public void ValidateMhsmPrivateEndpointConnectionResourceMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.MhsmPrivateEndpointConnectionResourceMockTests", methodName, argTypes);
        }

        [TestCase("Get")]
        [TestCase("Delete")]
        public void ValidatePrivateEndpointConnectionResourceMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.MgmtMockAndSamplePrivateEndpointConnectionResourceMockTests", methodName, argTypes);
        }

        [TestCase("Get")]
        [TestCase("Delete")]
        //[TestCase("Update")] // comment this because this corresponding generated test case is removed in order to test a new configuration
        [TestCase("GetPrivateLinkResources")]
        public void ValidateVaultResourceMockTests(string methodName, params string[] argTypes)
        {
            ValidateMethodExist("MgmtMockAndSample.Tests.Mock.VaultResourceMockTests", methodName, argTypes);
        }
    }
}
