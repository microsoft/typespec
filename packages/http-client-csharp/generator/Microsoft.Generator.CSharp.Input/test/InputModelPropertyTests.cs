// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Input.Tests
{
    public class InputModelPropertyTests
    {
        [Test]
        public void DeserializeInputModelProperty()
        {
            var json = @"{
    ""$id"": ""1"",
    ""Name"": ""Client.Naming"",
    ""ApiVersions"": [],
    ""Models"": [{
               ""$id"": ""9"",
               ""Kind"": ""model"",
               ""Name"": ""ClientNameModel"",
               ""CrossLanguageDefinitionId"": ""Client.Naming.Property.ClientNameModel"",
               ""Usage"": ""Input,Json"",
               ""Decorators"": [],
               ""Properties"": [
                {
                 ""$id"": ""10"",
                 ""Name"": ""clientName"",
                 ""SerializedName"": ""defaultName"",
                 ""Description"": ""Pass in true"",
                 ""Type"": {
                  ""$id"": ""11"",
                  ""Kind"": ""boolean"",
                  ""Name"": ""boolean"",
                  ""CrossLanguageDefinitionId"": ""TypeSpec.boolean"",
                  ""Decorators"": []
                 },
                 ""IsRequired"": true,
                 ""IsReadOnly"": false,
                 ""Decorators"": [],
                 ""EnclosingType"": {
                  ""$ref"": ""9""
                 }
                }
               ]
              }]}";
            var ns = TypeSpecSerialization.Deserialize(json);
            Assert.AreEqual("Client.Naming", ns!.Name);
            Assert.AreEqual(1, ns.Models.Count);
            Assert.AreEqual("ClientNameModel", ns.Models[0].Name);
            Assert.AreEqual("Client.Naming.Property.ClientNameModel", ns.Models[0].CrossLanguageDefinitionId);
            Assert.AreEqual("Input, Json", ns.Models[0].Usage.ToString());
            Assert.AreEqual(1, ns.Models[0].Properties.Count);
            Assert.AreEqual("clientName", ns.Models[0].Properties[0].Name);
            Assert.AreEqual("defaultName", ns.Models[0].Properties[0].SerializedName);
            Assert.AreEqual("Pass in true", ns.Models[0].Properties[0].Description);
            Assert.AreEqual(true, ns.Models[0].Properties[0].IsRequired);
            Assert.AreEqual(false, ns.Models[0].Properties[0].IsReadOnly);
            Assert.AreEqual("boolean", ns.Models[0].Properties[0].Type.Name);
            Assert.AreEqual("ClientNameModel", ns.Models[0].Properties[0].EnclosingType.Name);
        }
    }
}
