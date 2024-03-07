// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System.Linq;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt
{
    public class StringExtensionsTests
    {
        [TestCase("MetadataRole", "MetadataRoles")]
        [TestCase("KeyInformation", "AllKeyInformation")]
        [TestCase("RoleMetadata", "AllRoleMetadata")]
        [TestCase("Redis", "AllRedis")]
        public void ValidateResourceNameToPlural(string resourceName, string expected)
        {
            var result = resourceName.ResourceNameToPlural();
            Assert.AreEqual(expected, result);
        }

        [TestCase("MetadataRole", "MetadataRoleResource")]
        [TestCase("PrivateResource", "PrivateResource")]
        [TestCase("PrivateResource2", "PrivateResource2Resource")]
        public void ValidateAddResourceSuffixToResourceName(string resourceName, string expected)
        {
            var result = resourceName.AddResourceSuffixToResourceName();
            Assert.AreEqual(expected, result);

        }

        [TestCase("CamelCase", new[] { "Camel", "Case" })]
        [TestCase("IPAddress", new[] { "IP", "Address" })]
        [TestCase("HTTPIsURL", new[] { "HTTP", "Is", "URL" })]
        [TestCase("GetAllByLocation", new[] { "Get", "All", "By", "Location" })]
        [TestCase("ExtendedLocationType", new[] { "ExtendedLocation", "Type"})]
        [TestCase("extendedLocationType", new[] { "ExtendedLocation", "Type"})]
        [TestCase("extendedlocationType", new[] { "Extendedlocation", "Type"})]
        [TestCase("extendedlocationtype", new[] { "Extendedlocationtype"})]
        [TestCase("AzureExtendedLocationType", new[] { "Azure", "ExtendedLocation", "Type"})]
        [TestCase("ExtendedLocationTypeDef", new[] { "ExtendedLocation", "Type", "Def"})]
        [TestCase("AzureExtendedLocationTypeDef", new[] { "Azure", "ExtendedLocation", "Type", "Def"})]
        [TestCase("ResourceType", new[] { "ResourceType"})]
        [TestCase("ResourceTypeAliasType", new[] { "ResourceType", "Alias", "Type"})]
        [TestCase("AzureResourceTypeExtendedLocationType", new[] { "Azure", "ResourceType", "ExtendedLocation", "Type"})]
        [TestCase("AzureResourceTypeExtendedLocationTypeAlias", new[] { "Azure", "ResourceType", "ExtendedLocation", "Type", "Alias"})]
        [TestCase("ResourceTypeExtendedLocationType", new[] { "ResourceType", "ExtendedLocation", "Type"})]
        [TestCase("ResourceTypeAliasTypeExtendedLocationType", new[] { "ResourceType", "Alias", "Type", "ExtendedLocation", "Type"})]
        [TestCase("VirtualMachine", new[] { "VirtualMachine"})]
        [TestCase("VirtualMachineScaleSet", new[] { "VirtualMachine", "Scale", "Set"})]
        [TestCase("VirtualMachineResourceTypeExtendedLocation", new[] { "VirtualMachine","ResourceType", "ExtendedLocation"})]
        [TestCase("VirtualMachineResourceTypeAliasTypeExtendedLocationType", new[] { "VirtualMachine", "ResourceType", "Alias", "Type", "ExtendedLocation", "Type"})]
        [TestCase("AzureVirtualMachineResourceTypeExtendedLocation", new[] { "Azure", "VirtualMachine","ResourceType", "ExtendedLocation"})]
        [TestCase("snake_case", new[] { "Snake", "Case" })]
        [TestCase("single", new[] { "Single" })]
        [TestCase("", new[] { "" })]
        [TestCase("_", new[] { "", "" })]
        public void ValidateSplitByCamelCaseAndGroup(string camelCase, string[] expected)
        {
            var result = camelCase.SplitByCamelCaseAndGroup().ToArray();
            Assert.AreEqual(expected.Length, result.Length);
            for (int i = 0; i < expected.Length; i++)
            {
                Assert.AreEqual(expected[i], result[i]);
            }
        }

        [TestCase("/subs/{subsId}/rgs/{name}/foo/bar/{something}", "/subs/{subsId}/rgs/{name}/foo", true)]
        [TestCase("/subs/{subsId}/rgs/{name}/foo/bar/{something}", "/subs/{id}/rgs/{n}/foo", true)]
        [TestCase("/subs/{subsId}/rgs/{name}/foo/bar/{something}", "/subs/{id}/rGs/{n}/foo", false)]
        [TestCase("/subs/{subsId}/rgs/{name}/foo/bar/{something}", "/subs/{id", false)] // one of the path is incomplete
        [TestCase("abcde", "ab", true)]
        [TestCase("/subs/{id}/rGs/{n}/foo", "/subs/{subsId}/rgs/{name}/foo/bar/{something}", false)]
        public void IsPrefixTest(string candidate, string requestPath, bool expected)
        {
            Assert.AreEqual(expected, RequestPath.IsPrefix(requestPath, candidate));
        }
    }
}
