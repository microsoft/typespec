// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace _Specs_.Azure.ClientGenerator.Core.Access.Models
{
    /// <summary> Unknown version of AbstractModel. </summary>
    internal partial class UnknownAbstractModel : AbstractModel
    {
        /// <summary> Initializes a new instance of <see cref="UnknownAbstractModel"/>. </summary>
        /// <param name="kind"> Discriminator. </param>
        /// <param name="name"></param>
        /// <param name="serializedAdditionalRawData"> Keeps track of any properties unknown to the library. </param>
        internal UnknownAbstractModel(string kind, string name, IDictionary<string, BinaryData> serializedAdditionalRawData) : base(kind, name, serializedAdditionalRawData)
        {
        }

        /// <summary> Initializes a new instance of <see cref="UnknownAbstractModel"/> for deserialization. </summary>
        internal UnknownAbstractModel()
        {
        }
    }
}
