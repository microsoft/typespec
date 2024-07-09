// <auto-generated/>

#nullable disable

using System;
using UnbrandedTypeSpec;

namespace UnbrandedTypeSpec.Models
{
    /// <summary> this is not a friendly model but with a friendly name. </summary>
    public partial class Friend
    {
        /// <summary> Initializes a new instance of <see cref="Friend"/>. </summary>
        /// <param name="name"> name of the NotFriend. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="name"/> is null. </exception>
        public Friend(string name)
        {
            Argument.AssertNotNull(name, nameof(name));

            Name = name;
        }

        /// <summary> name of the NotFriend. </summary>
        public string Name { get; set; }

        /// <summary> property with unfriendly wire name. </summary>
        public string PropertyWithUnfriendlyWireName { get; set; }

        /// <summary> this is a property with a wire name starting with an upper case letter. </summary>
        public int? PropertyStartsWithUpperCaseLetterInTheWireName { get; set; }
    }
}
