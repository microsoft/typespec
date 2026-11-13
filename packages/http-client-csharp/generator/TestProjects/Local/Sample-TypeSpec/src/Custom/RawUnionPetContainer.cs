// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace SampleTypeSpec
{
    public partial class RawUnionPetContainer
    {
        public BinaryData Pet { get; set; }
        public BinaryData NullablePet { get; set; }
        public IList<BinaryData> Pets { get; }
        public IDictionary<string, BinaryData> Lookup { get; }
        public BinaryData RawPets { get; set; }
        public BinaryData RawLookup { get; set; }
    }
}
