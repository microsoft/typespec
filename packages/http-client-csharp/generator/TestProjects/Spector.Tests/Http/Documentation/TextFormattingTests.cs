// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using Documentation;
using Documentation._Lists;
using Documentation._TextFormatting;
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

            // Validate method documentation
            var method = typeof(TextFormatting).GetMethod("BoldTextAsync", new[] { typeof(CancellationToken) });
            Assert.IsNotNull(method, "BoldTextAsync method should exist");
            var methodXml = GetXmlDocumentation(method!);
            Assert.That(methodXml, Does.Contain("<b>bold text</b>"), "BoldText should have <b> tags");
            Assert.That(methodXml, Does.Contain("<b>multiple bold</b>"), "BoldText should have multiple <b> tags");
            Assert.That(methodXml, Does.Not.Contain("**"), "BoldText should not have markdown ** syntax");
        });

        [SpectorTest]
        public Task ItalicText() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().ItalicTextAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);

            // Validate method documentation
            var method = typeof(TextFormatting).GetMethod("ItalicTextAsync", new[] { typeof(CancellationToken) });
            Assert.IsNotNull(method, "ItalicTextAsync method should exist");
            var methodXml = GetXmlDocumentation(method!);
            Assert.That(methodXml, Does.Contain("<i>italic text</i>"), "ItalicText should have <i> tags");
            Assert.That(methodXml, Does.Contain("<i>multiple italic</i>"), "ItalicText should have multiple <i> tags");
        });

        [SpectorTest]
        public Task CombinedFormatting() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().CombinedFormattingAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);

            // Validate method documentation
            var method = typeof(TextFormatting).GetMethod("CombinedFormattingAsync", new[] { typeof(CancellationToken) });
            Assert.IsNotNull(method, "CombinedFormattingAsync method should exist");
            var methodXml = GetXmlDocumentation(method!);
            Assert.That(methodXml, Does.Contain("<b>bold</b>"), "CombinedFormatting should have <b> tags");
            Assert.That(methodXml, Does.Contain("<i>italic</i>"), "CombinedFormatting should have <i> tags");
            Assert.That(methodXml, Does.Contain("<b><i>bold italic</i></b>"), "CombinedFormatting should have nested tags");
        });

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
