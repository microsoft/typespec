// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Text.Json;
using System.Threading.Tasks;
using Azure;
using Azure.Core;
using Azure.Identity;
using NUnit.Framework;
using _Type.Property.ValueTypes;
using _Type.Property.ValueTypes.Models;

namespace _Type.Property.ValueTypes.Samples
{
    public partial class Samples_IntLiteral
    {
        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_GetIntLiteral_ShortVersion()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response response = client.GetIntLiteral(null);

            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Console.WriteLine(result.GetProperty("property").ToString());
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_GetIntLiteral_ShortVersion_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response response = await client.GetIntLiteralAsync(null);

            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Console.WriteLine(result.GetProperty("property").ToString());
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_GetIntLiteral_ShortVersion_Convenience()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response<IntLiteralProperty> response = client.GetIntLiteral();
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_GetIntLiteral_ShortVersion_Convenience_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response<IntLiteralProperty> response = await client.GetIntLiteralAsync();
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_GetIntLiteral_AllParameters()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response response = client.GetIntLiteral(null);

            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Console.WriteLine(result.GetProperty("property").ToString());
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_GetIntLiteral_AllParameters_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response response = await client.GetIntLiteralAsync(null);

            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Console.WriteLine(result.GetProperty("property").ToString());
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_GetIntLiteral_AllParameters_Convenience()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response<IntLiteralProperty> response = client.GetIntLiteral();
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_GetIntLiteral_AllParameters_Convenience_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            Response<IntLiteralProperty> response = await client.GetIntLiteralAsync();
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_Put_ShortVersion()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            using RequestContent content = RequestContent.Create(new
            {
                property = 42,
            });
            Response response = client.Put(content);

            Console.WriteLine(response.Status);
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_Put_ShortVersion_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            using RequestContent content = RequestContent.Create(new
            {
                property = 42,
            });
            Response response = await client.PutAsync(content);

            Console.WriteLine(response.Status);
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_Put_ShortVersion_Convenience()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            IntLiteralProperty body = new IntLiteralProperty();
            Response response = client.Put(body);
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_Put_ShortVersion_Convenience_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            IntLiteralProperty body = new IntLiteralProperty();
            Response response = await client.PutAsync(body);
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_Put_AllParameters()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            using RequestContent content = RequestContent.Create(new
            {
                property = 42,
            });
            Response response = client.Put(content);

            Console.WriteLine(response.Status);
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_Put_AllParameters_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            using RequestContent content = RequestContent.Create(new
            {
                property = 42,
            });
            Response response = await client.PutAsync(content);

            Console.WriteLine(response.Status);
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public void Example_IntLiteral_Put_AllParameters_Convenience()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            IntLiteralProperty body = new IntLiteralProperty();
            Response response = client.Put(body);
        }

        [Test]
        [Ignore("Only validating compilation of examples")]
        public async Task Example_IntLiteral_Put_AllParameters_Convenience_Async()
        {
            IntLiteral client = new ValueTypesClient().GetIntLiteralClient();

            IntLiteralProperty body = new IntLiteralProperty();
            Response response = await client.PutAsync(body);
        }
    }
}
