// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using System.Xml;
using Documentation;
using Documentation._Lists;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.Documentation
{
    public class ListsTests : SpectorTestBase
    {
        [SpectorTest]
        public Task BulletPointsOp() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetListsClient().BulletPointsOpAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/microsoft/typespec/issues/9173")]
        public Task BulletPointsModel() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var input = new BulletPointsModel(BulletPointsEnum.Simple);
            var response = await client.GetListsClient().BulletPointsModelAsync(input);
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task Numbered() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetListsClient().NumberedAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public void ValidateBulletPointsEnumDocumentation()
        {
            var enumType = typeof(BulletPointsEnum);

            // Validate Simple enum value has bullet list XML tags
            var simpleField = enumType.GetField("Simple");
            Assert.IsNotNull(simpleField, "Simple field should exist");
            var simpleXml = GetXmlDocumentation(simpleField!);
            Assert.That(simpleXml, Does.Contain("<list type=\"bullet\">"), "Simple enum should have bullet list");
            Assert.That(simpleXml, Does.Contain("<item>"), "Simple enum should have list items");
            Assert.That(simpleXml, Does.Contain("<description>"), "Simple enum should have item descriptions");

            // Validate Bold enum value has both bold tags and bullet list
            var boldField = enumType.GetField("Bold");
            Assert.IsNotNull(boldField, "Bold field should exist");
            var boldXml = GetXmlDocumentation(boldField!);
            Assert.That(boldXml, Does.Contain("<b>bold text</b>"), "Bold enum should have <b> tags");
            Assert.That(boldXml, Does.Contain("<list type=\"bullet\">"), "Bold enum should have bullet list");
            Assert.That(boldXml, Does.Contain("<b>One</b>"), "Bold enum list items should have <b> tags");

            // Validate Italic enum value has both italic tags and bullet list
            var italicField = enumType.GetField("Italic");
            Assert.IsNotNull(italicField, "Italic field should exist");
            var italicXml = GetXmlDocumentation(italicField!);
            Assert.That(italicXml, Does.Contain("<i>italic text</i>"), "Italic enum should have <i> tags");
            Assert.That(italicXml, Does.Contain("<list type=\"bullet\">"), "Italic enum should have bullet list");
            Assert.That(italicXml, Does.Contain("<i>One</i>"), "Italic enum list items should have <i> tags");
        }

        private string GetXmlDocumentation(MemberInfo member)
        {
            var assembly = member.DeclaringType?.Assembly;
            Assert.IsNotNull(assembly, "Assembly should not be null");
            var assemblyPath = assembly!.Location;
            var xmlPath = System.IO.Path.ChangeExtension(assemblyPath, ".xml");

            if (!System.IO.File.Exists(xmlPath))
            {
                Assert.Fail($"XML documentation file not found: {xmlPath}");
            }

            var xmlDoc = new XmlDocument();
            xmlDoc.Load(xmlPath);

            // Build the member name for XML lookup
            var memberName = GetMemberName(member);
            var xpath = $"/doc/members/member[@name='{memberName}']";
            var node = xmlDoc.SelectSingleNode(xpath);

            if (node == null)
            {
                Assert.Fail($"XML documentation not found for member: {memberName}");
            }

            return node!.InnerXml;
        }

        private string GetMemberName(MemberInfo member)
        {
            var declaringType = member.DeclaringType;
            Assert.IsNotNull(declaringType, "Declaring type should not be null");
            var typeName = declaringType!.FullName?.Replace('+', '.');
            Assert.IsNotNull(typeName, "Type name should not be null");

            if (member is FieldInfo)
            {
                return $"F:{typeName}.{member.Name}";
            }
            else if (member is MethodInfo method)
            {
                return $"M:{typeName}.{member.Name}";
            }
            else if (member is PropertyInfo)
            {
                return $"P:{typeName}.{member.Name}";
            }

            return $"T:{typeName}";
        }
    }
}
