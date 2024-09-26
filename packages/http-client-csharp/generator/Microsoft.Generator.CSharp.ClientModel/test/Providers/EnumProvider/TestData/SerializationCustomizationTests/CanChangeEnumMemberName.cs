// <auto-generated/>

#nullable disable

using System;

namespace Sample.Models
{
    internal static partial class MockInputModelExtensions
    {
        public static string ToSerialString(this global::Sample.Models.MockInputModel value) => value switch
        {
            global::Sample.Models.MockInputModel.Red => 1,
            global::Sample.Models.MockInputModel.Green => 2,
            global::Sample.Models.MockInputModel.SkyBlue => 3,
            _ => throw new global::System.ArgumentOutOfRangeException(nameof(value), value, "Unknown MockInputModel value.")
        };

        public static global::Sample.Models.MockInputModel ToMockInputModel(this string value)
        {
            if (string.Equals(value, 1, global::System.StringComparison.InvariantCultureIgnoreCase))
            {
                return global::Sample.Models.MockInputModel.Red;
            }
            if (string.Equals(value, 2, global::System.StringComparison.InvariantCultureIgnoreCase))
            {
                return global::Sample.Models.MockInputModel.Green;
            }
            if (string.Equals(value, 3, global::System.StringComparison.InvariantCultureIgnoreCase))
            {
                return global::Sample.Models.MockInputModel.SkyBlue;
            }
            throw new global::System.ArgumentOutOfRangeException(nameof(value), value, "Unknown MockInputModel value.");
        }
    }
}
