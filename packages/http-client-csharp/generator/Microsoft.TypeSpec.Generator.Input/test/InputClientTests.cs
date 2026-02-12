// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputClientTests
    {
        [Test]
        public void CanUpdateClientName()
        {
            var client = InputFactory.Client("OriginalName");
            client.Update(name: "UpdatedName");

            Assert.AreEqual("UpdatedName", client.Name);
        }

        [Test]
        public void UpdateWithNullNameDoesNotChangeName()
        {
            var client = InputFactory.Client("OriginalName");
            var originalName = client.Name;

            client.Update(); // name parameter is null

            Assert.AreEqual(originalName, client.Name);
        }

        [Test]
        public void CanUpdateClientNamespace()
        {
            var client = InputFactory.Client("TestClient", "OriginalNamespace");
            client.Update(@namespace: "UpdatedNamespace");

            Assert.AreEqual("UpdatedNamespace", client.Namespace);
        }

        [Test]
        public void CanUpdateClientCrossLanguageDefinitionId()
        {
            var client = InputFactory.Client("TestClient", crossLanguageDefinitionId: "OriginalId");
            client.Update(crossLanguageDefinitionId: "UpdatedId");

            Assert.AreEqual("UpdatedId", client.CrossLanguageDefinitionId);
        }

        [Test]
        public void CanUpdateClientSummary()
        {
            var client = InputFactory.Client("TestClient");
            client.Update(summary: "Updated summary");

            Assert.AreEqual("Updated summary", client.Summary);
        }

        [Test]
        public void CanUpdateClientDoc()
        {
            var client = InputFactory.Client("TestClient", doc: "Original doc");
            client.Update(doc: "Updated documentation");

            Assert.AreEqual("Updated documentation", client.Doc);
        }

        [Test]
        public void CanUpdateClientMethods()
        {
            var operation = InputFactory.Operation("TestOperation", "TestService");
            var method = InputFactory.BasicServiceMethod("TestMethod", operation);
            var client = InputFactory.Client("TestClient", methods: []);
            
            client.Update(methods: [method]);

            Assert.AreEqual(1, client.Methods.Count);
            Assert.AreEqual("TestMethod", client.Methods[0].Name);
        }

        [Test]
        public void CanUpdateClientParameters()
        {
            var parameter = InputFactory.HeaderParameter("testParam", InputPrimitiveType.String);
            var client = InputFactory.Client("TestClient", parameters: []);
            
            client.Update(parameters: [parameter]);

            Assert.AreEqual(1, client.Parameters.Count);
            Assert.AreEqual("testParam", client.Parameters[0].Name);
        }

        [Test]
        public void CanUpdateClientParent()
        {
            var parentClient = InputFactory.Client("ParentClient");
            var client = InputFactory.Client("TestClient");
            
            client.Update(parent: parentClient);

            Assert.IsNotNull(client.Parent);
            Assert.AreEqual("ParentClient", client.Parent!.Name);
        }

        [Test]
        public void CanUpdateClientChildren()
        {
            var childClient = InputFactory.Client("ChildClient");
            var client = InputFactory.Client("TestClient");
            
            client.Update(children: [childClient]);

            Assert.AreEqual(1, client.Children.Count);
            Assert.AreEqual("ChildClient", client.Children[0].Name);
        }

        [Test]
        public void CanUpdateClientApiVersions()
        {
            var client = InputFactory.Client("TestClient", apiVersions: []);
            var newApiVersions = new[] { "2024-01-01", "2024-06-01-preview" };
            
            client.Update(apiVersions: newApiVersions);

            Assert.AreEqual(2, client.ApiVersions.Count);
            Assert.Contains("2024-01-01", client.ApiVersions.ToList());
            Assert.Contains("2024-06-01-preview", client.ApiVersions.ToList());
        }

        [Test]
        public void CanUpdateMultiplePropertiesAtOnce()
        {
            var client = InputFactory.Client("OriginalName", "OriginalNamespace");
            var apiVersions = new[] { "2024-01-01" };
            
            client.Update(
                name: "UpdatedName",
                @namespace: "UpdatedNamespace",
                summary: "Updated summary",
                doc: "Updated documentation",
                apiVersions: apiVersions
            );

            Assert.AreEqual("UpdatedName", client.Name);
            Assert.AreEqual("UpdatedNamespace", client.Namespace);
            Assert.AreEqual("Updated summary", client.Summary);
            Assert.AreEqual("Updated documentation", client.Doc);
            Assert.AreEqual(1, client.ApiVersions.Count);
            Assert.Contains("2024-01-01", client.ApiVersions.ToList());
        }

        [Test]
        public void UpdateWithNullParametersDoesNotChangeProperties()
        {
            var apiVersions = new[] { "2024-01-01" };
            var client = InputFactory.Client("OriginalName", "OriginalNamespace", apiVersions: apiVersions);
            
            var originalName = client.Name;
            var originalNamespace = client.Namespace;
            var originalCrossLanguageDefinitionId = client.CrossLanguageDefinitionId;
            var originalSummary = client.Summary;
            var originalDoc = client.Doc;
            var originalMethods = client.Methods;
            var originalParameters = client.Parameters;
            var originalParent = client.Parent;
            var originalChildren = client.Children;
            var originalApiVersions = client.ApiVersions;

            client.Update(); // All parameters are null

            Assert.AreEqual(originalName, client.Name);
            Assert.AreEqual(originalNamespace, client.Namespace);
            Assert.AreEqual(originalCrossLanguageDefinitionId, client.CrossLanguageDefinitionId);
            Assert.AreEqual(originalSummary, client.Summary);
            Assert.AreEqual(originalDoc, client.Doc);
            Assert.AreEqual(originalMethods, client.Methods);
            Assert.AreEqual(originalParameters, client.Parameters);
            Assert.AreEqual(originalParent, client.Parent);
            Assert.AreEqual(originalChildren, client.Children);
            Assert.AreEqual(originalApiVersions, client.ApiVersions);
        }

        [Test]
        public void UpdateMethodsReplacesExistingMethods()
        {
            var operation1 = InputFactory.Operation("Operation1", "TestService");
            var method1 = InputFactory.BasicServiceMethod("Method1", operation1);
            var operation2 = InputFactory.Operation("Operation2", "TestService");
            var method2 = InputFactory.BasicServiceMethod("Method2", operation2);
            
            var client = InputFactory.Client("TestClient", methods: [method1]);
            Assert.AreEqual(1, client.Methods.Count);
            Assert.AreEqual("Method1", client.Methods[0].Name);
            
            client.Update(methods: [method2]);
            
            Assert.AreEqual(1, client.Methods.Count);
            Assert.AreEqual("Method2", client.Methods[0].Name);
        }

        [Test]
        public void UpdateParametersReplacesExistingParameters()
        {
            var param1 = InputFactory.HeaderParameter("param1", InputPrimitiveType.String);
            var param2 = InputFactory.HeaderParameter("param2", InputPrimitiveType.Int32);
            
            var client = InputFactory.Client("TestClient", parameters: [param1]);
            Assert.AreEqual(1, client.Parameters.Count);
            Assert.AreEqual("param1", client.Parameters[0].Name);
            
            client.Update(parameters: [param2]);
            
            Assert.AreEqual(1, client.Parameters.Count);
            Assert.AreEqual("param2", client.Parameters[0].Name);
        }

        [Test]
        public void UpdateChildrenReplacesExistingChildren()
        {
            var child1 = InputFactory.Client("Child1");
            var child2 = InputFactory.Client("Child2");
            
            var client = InputFactory.Client("TestClient");
            client.Update(children: [child1]);
            Assert.AreEqual(1, client.Children.Count);
            Assert.AreEqual("Child1", client.Children[0].Name);
            
            client.Update(children: [child2]);
            
            Assert.AreEqual(1, client.Children.Count);
            Assert.AreEqual("Child2", client.Children[0].Name);
        }

        [Test]
        public void UpdateApiVersionsReplacesExistingApiVersions()
        {
            var apiVersions1 = new[] { "2024-01-01" };
            var apiVersions2 = new[] { "2024-06-01", "2024-12-01" };
            
            var client = InputFactory.Client("TestClient", apiVersions: apiVersions1);
            Assert.AreEqual(1, client.ApiVersions.Count);
            Assert.Contains("2024-01-01", client.ApiVersions.ToList());
            
            client.Update(apiVersions: apiVersions2);
            
            Assert.AreEqual(2, client.ApiVersions.Count);
            Assert.Contains("2024-06-01", client.ApiVersions.ToList());
            Assert.Contains("2024-12-01", client.ApiVersions.ToList());
        }
    }
}
