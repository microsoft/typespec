// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace CustomizationsInTsp.Models
{
    public partial class RootModel
    {
        internal ModelToMakeInternal PropertyModelToMakeInternal { get; set; }

        /// <summary> Enum type property to move to customization code. </summary>
        public NormalEnum? PropertyToMoveToCustomization { get; set; }
    }
}
