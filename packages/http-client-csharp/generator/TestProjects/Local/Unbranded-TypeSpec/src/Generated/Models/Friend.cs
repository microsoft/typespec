// <auto-generated/>

#nullable disable

using System;

namespace UnbrandedTypeSpec.Models
{
    public partial class Friend
    {
        /// <summary> Initializes a new instance of <see cref="Friend"/>. </summary>
        /// <param name="name"> name of the NotFriend. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="name"/> is null. </exception>
        public Friend(string name)
        {
            if (name == null)
            {
                throw new ArgumentNullException(nameof(name));
            }

            Name = name;
        }

        /// <summary> name of the NotFriend. </summary>
        public string Name { get; set; }
    }
}
