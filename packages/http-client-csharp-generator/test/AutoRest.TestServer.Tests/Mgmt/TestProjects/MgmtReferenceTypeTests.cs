// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Azure;
using Azure.ResourceManager;
using Azure.ResourceManager.Fake.Models;
using NUnit.Framework;
using MgmtReferenceTypes.Models;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtReferenceTypeTests : TestProjectTests
    {
        public MgmtReferenceTypeTests()
            : base("MgmtReferenceTypes")
        {
        }

        private const string ReferenceNamespace = "Azure.ResourceManager.Fake.Models";
        private const string ProjectNamespace = "MgmtReferenceTypes.Models";
        private IEnumerable<Type>? _referenceTypes;
        private IEnumerable<Type>? _projectTypes;
        private IEnumerable<Type> ReferenceTypes => _referenceTypes ??= Assembly.GetAssembly(typeof(MgmtReferenceTypesResourceDataContent)).GetTypes().Where(
            t => t.IsPublic &&
            t.Namespace == ReferenceNamespace &&
            !t.IsEnum);
        private IEnumerable<Type> ProjectTypes => _projectTypes ??= Assembly.GetAssembly(typeof(MgmtReferenceTypesResourceDataContent)).GetTypes().Where(
            t => t.IsPublic &&
            t.Namespace == ProjectNamespace &&
            !t.IsEnum);

        protected override IEnumerable<Type> MyTypes() => ReferenceTypes;

        [Test]
        public void ValidateSerialization()
        {
            //all should have serialization
            foreach (var type in ReferenceTypes)
            {
                if (type.IsValueType)
                    continue;

                if (type.GetCustomAttributes(typeof(ReferenceTypeAttribute), false).Any())
                    continue;

                Assert.IsNotNull(type.GetInterface("IUtf8JsonSerializable", true), $"IUtf8JsonSerializable interface was not found for {type.Name}");
                Assert.IsNotNull(type.GetMethod($"Deserialize{type.Name}", BindingFlags.NonPublic | BindingFlags.Static), $"Deserialize{type.Name} method was not found for {type.Name}");
            }
        }

        [TestCase(typeof(MgmtReferenceTypesResourceDataContent), ReferenceNamespace)]
        [TestCase(typeof(TrackedResource), ReferenceNamespace)]
        [TestCase(typeof(MgmtReferenceTypesSku), ReferenceNamespace)]
        [TestCase(typeof(MgmtReferenceTypesSkuTier), ReferenceNamespace)]
        [TestCase(typeof(CreatedByType), ReferenceNamespace)]
        [TestCase(typeof(ResourceNon), ProjectNamespace)]
        [TestCase(typeof(PrivateLinkResourceData), ReferenceNamespace)]
        [TestCase(typeof(PrivateLinkResourceList), ReferenceNamespace)]
        [TestCase(typeof(PrivateEndpointConnectionData), ReferenceNamespace)]
        [TestCase(typeof(PrivateEndpointConnectionList), ReferenceNamespace)]
        public void ValidateNamespace(Type typeToTest, string expectedNamespace)
        {
            //all should be resources.models namespace from referencetype
            //all should be referencetype.modesl namespace from nonreferencetype
            Assert.AreEqual(expectedNamespace, typeToTest.Namespace);
        }

        [TestCase(typeof(MgmtReferenceTypesResourceDataContent), typeof(ReferenceTypeAttribute))]
        [TestCase(typeof(TrackedResource), typeof(ReferenceTypeAttribute))]
        [TestCase(typeof(MgmtReferenceTypesSku), typeof(PropertyReferenceTypeAttribute))]
        [TestCase(typeof(PrivateLinkResourceData), typeof(TypeReferenceTypeAttribute))]
        [TestCase(typeof(PrivateLinkResourceList), typeof(TypeReferenceTypeAttribute))]
        [TestCase(typeof(PrivateEndpointConnectionData), typeof(TypeReferenceTypeAttribute))]
        [TestCase(typeof(PrivateEndpointConnectionList), typeof(TypeReferenceTypeAttribute))]
        public void ValidateReferrenceTypeAttributes(Type referenceType, Type attributeType)
        {
            Assert.IsNotNull(referenceType.GetCustomAttribute(attributeType), $"ReferenceType attribute was not found for {referenceType.Name}");
            var ctors = referenceType.GetConstructors();
            Assert.IsNotNull(ctors.Any(c => c.GetCustomAttribute(typeof(InitializationConstructorAttribute)) != null), $"InitializationConstructor attribute was not found for {referenceType.Name}");
            Assert.IsNotNull(ctors.Any(c => c.GetCustomAttribute(typeof(SerializationConstructorAttribute)) != null), $"SerializationConstructor attribute was not found for {referenceType.Name}");
        }

        [Test]
        public void ValidateResponseErrorFromAzureCore()
        {
            var property = typeof(ErrorResponse).GetProperty("Error");
            Assert.IsNotNull(property);
            Assert.AreEqual(typeof(ResponseError), property.PropertyType);
        }
    }
}
