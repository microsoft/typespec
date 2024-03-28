// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System.ClientModel.Primitives;
using System.Text.Json;
using Azure;

namespace dpg_customization_LowLevel.Models
{
    public partial class Product
    {
        internal static Product DeserializeProduct(JsonElement element, ModelReaderWriterOptions options = null)
        {
            options ??= new ModelReaderWriterOptions("W");

            ProductReceived received = default;
            foreach (var property in element.EnumerateObject())
            {
                if (property.NameEquals("received"))
                {
                    received = new ProductReceived(property.Value.GetString());
                    continue;
                }
            }
            return new Product(received);
        }

        /// <summary> Deserializes the model from a raw response. </summary>
        /// <param name="response"> The response to deserialize the model from. </param>
        internal static Product FromResponse(Response response)
        {
            using var document = JsonDocument.Parse(response.Content);
            return DeserializeProduct(document.RootElement);
        }
    }
}
