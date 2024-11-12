// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace UnbrandedTypeSpec.Models
{
    /// <summary> this is not a friendly model but with a friendly name. </summary>
    public partial class Friend
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        internal Friend(string name)
        {
            Name = name;
        }

        internal Friend(string name, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            Name = name;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        /// <summary> name of the NotFriend. </summary>
        public string Name { get; }
    }
}
