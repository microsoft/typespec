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
    public class TextFormattingTests : SpectorTestBase
    {
        [SpectorTest]
        public Task BoldText() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().BoldTextAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task ItalicText() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().ItalicTextAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task CombinedFormatting() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().CombinedFormattingAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public void ValidateFormattingDocumentation()
        {
            // Validate that BulletPointsEnum has properly formatted documentation
            var enumType = typeof(BulletPointsEnum);

            // Check that Bold enum value has <b> tags (not **bold**)
            var boldField = enumType.GetField("Bold");
            Assert.IsNotNull(boldField, "Bold field should exist");
            var boldXml = GetXmlDocumentation(boldField!);
            Assert.That(boldXml, Does.Contain("<b>bold text</b>"), "Documentation should contain <b> tags, not markdown **");
            Assert.That(boldXml, Does.Not.Contain("**"), "Documentation should not contain markdown ** syntax");

            // Check that Italic enum value has <i> tags (not *italic*)
            var italicField = enumType.GetField("Italic");
            Assert.IsNotNull(italicField, "Italic field should exist");
            var italicXml = GetXmlDocumentation(italicField!);
            Assert.That(italicXml, Does.Contain("<i>italic text</i>"), "Documentation should contain <i> tags, not markdown *");
            Assert.That(italicXml, Does.Not.Contain("*italic*"), "Documentation should not contain markdown * syntax");
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
