// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System.Text.Json;
using Azure;

namespace dpg_customization_LowLevel.Models
{
    /// <summary> The Product. </summary>
    public partial class Product
    {
        /// <summary> Initializes a new instance of Product. </summary>
        /// <param name="received"></param>
        public Product(ProductReceived received)
        {
            Received = received;
        }

        /// <summary> Gets the received. </summary>
        public ProductReceived Received { get; }
    }
}
