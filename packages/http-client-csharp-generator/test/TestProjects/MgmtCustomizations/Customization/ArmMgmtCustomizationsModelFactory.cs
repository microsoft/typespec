// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using Azure.Core;
using Azure.ResourceManager.Models;
using MgmtCustomizations;

namespace MgmtCustomizations.Models
{
    /// <summary> Model factory for models. </summary>
    public static partial class ArmMgmtCustomizationsModelFactory
    {
        /// <summary> Initializes a new instance of Dog. </summary>
        /// <param name="name"> The name of the pet. </param>
        /// <param name="size">
        /// The size of the pet. This property here is mocking the following scenario:
        /// Despite in the swagger it has a type of string, in the real payload of this request, the service is actually sending using a number, therefore the type in this swagger here is wrong and we have to fix it using customization code.
        /// </param>
        /// <param name="dateOfBirth"> Pet date of birth. </param>
        /// <param name="bark"> A dog can bark. </param>
        /// <param name="wrongInput"> Wrong input. </param>
        /// <returns> A new <see cref="T:MgmtCustomizations.Models.Dog" /> instance for mocking. </returns>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public static Dog Dog(string name, int size, DateTimeOffset? dateOfBirth, string bark, int? wrongInput)
        {
            return Dog(name, size, dateOfBirth, bark, jump: default);
        }
    }
}
