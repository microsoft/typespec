// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;

namespace Payload.Pageable
{
    /// <summary> The RequestQueryResponseHeaderResponse. </summary>
    internal partial class RequestQueryResponseHeaderResponse
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        internal RequestQueryResponseHeaderResponse(IEnumerable<Pet> pets)
        {
            Pets = pets.ToList();
        }

        internal RequestQueryResponseHeaderResponse(IList<Pet> pets, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            Pets = pets;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary> Gets the Pets. </summary>
        public IList<Pet> Pets { get; }
    }
}
