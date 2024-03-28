// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;

namespace CustomizationsInTsp.Models
{
    [CodeGenModel("ModelToRename")]
    public partial class RenamedModel
    {
        /// <summary> Optional int. </summary>
        public int? OptionalInt { get; set; }
    }
}
