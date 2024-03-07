// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

namespace MgmtCustomizations.Models
{
    public partial class Cat : Pet
    {
        /// <summary> A cat can meow. We changed the readonly flag of this property using customization code </summary>
        public string Meow { get; set; }
    }
}
