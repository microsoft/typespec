// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.Collections.Generic;
using System.Text.Json;
using Azure;
using Azure.Core;

namespace dpg_customization_LowLevel.Models
{
    /// <summary> The ProductResult. </summary>
    internal partial class ProductResult
    {
        /// <summary> Initializes a new instance of ProductResult. </summary>
        internal ProductResult()
        {
            Values = new ChangeTrackingList<Product>();
        }

        /// <summary> Initializes a new instance of ProductResult. </summary>
        /// <param name="values"></param>
        /// <param name="nextLink"></param>
        internal ProductResult(IReadOnlyList<Product> values, string nextLink)
        {
            Values = values;
            NextLink = nextLink;
        }

        /// <summary> Gets the values. </summary>
        public IReadOnlyList<Product> Values { get; }
        /// <summary> Gets the next link. </summary>
        public string NextLink { get; }

        public static implicit operator ProductResult(Response response)
        {
            try
            {
                return DeserializeProductResult(JsonDocument.Parse(response.Content.ToMemory()).RootElement);
            }
            catch
            {
                throw new RequestFailedException($"Failed to cast from Response to {typeof(ProductResult)}.");
            }
        }
    }
}
