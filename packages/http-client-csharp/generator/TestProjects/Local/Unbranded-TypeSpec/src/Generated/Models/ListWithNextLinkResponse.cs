// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;

namespace UnbrandedTypeSpec
{
    /// <summary> The ListWithNextLinkResponse. </summary>
    internal partial class ListWithNextLinkResponse
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        internal ListWithNextLinkResponse(IEnumerable<Thing> things)
        {
            Things = things.ToList();
        }

        internal ListWithNextLinkResponse(IList<Thing> things, Uri next, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            Things = things;
            Next = next;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary> Gets the Things. </summary>
        public IList<Thing> Things { get; }

        /// <summary> Gets the Next. </summary>
        public Uri Next { get; }
    }
}
