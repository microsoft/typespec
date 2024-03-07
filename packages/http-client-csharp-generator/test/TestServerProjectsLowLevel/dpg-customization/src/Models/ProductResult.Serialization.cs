// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System.Collections.Generic;
using System.Text.Json;
using Azure.Core;

namespace dpg_customization_LowLevel.Models
{
    internal partial class ProductResult
    {
        internal static ProductResult DeserializeProductResult(JsonElement element)
        {
            IReadOnlyList<Product> values = default;
            string nextLink = default;
            foreach (var property in element.EnumerateObject())
            {
                if (property.NameEquals("values"))
                {
                    if (property.Value.ValueKind == JsonValueKind.Null)
                    {
                        property.ThrowNonNullablePropertyIsNull();
                        continue;
                    }
                    List<Product> array = new List<Product>();
                    foreach (var item in property.Value.EnumerateArray())
                    {
                        array.Add(Product.DeserializeProduct(item));
                    }
                    values = array;
                    continue;
                }
                if (property.NameEquals("nextLink"))
                {
                    nextLink = property.Value.GetString();
                    continue;
                }
            }
            return new ProductResult(values ?? new ChangeTrackingList<Product>(), nextLink);
        }
    }
}
