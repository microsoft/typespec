// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;

namespace UnbrandedTypeSpec
{
    /// <summary> The ListWithContinuationTokenResponse. </summary>
    internal partial class ListWithContinuationTokenResponse
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        internal ListWithContinuationTokenResponse(IEnumerable<Thing> things)
        {
            Things = things.ToList();
        }

        internal ListWithContinuationTokenResponse(IList<Thing> things, string nextToken, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            Things = things;
            NextToken = nextToken;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary> Gets the Things. </summary>
        public IList<Thing> Things { get; }

        /// <summary> Gets the NextToken. </summary>
        public string NextToken { get; }
    }
}
