#nullable disable

using System;

namespace Test;

public partial class CustomOperatorType
{
    public static bool operator ==(CustomOperatorType left, CustomOperatorType right) => ReferenceEquals(left, right);

    public static bool operator !=(CustomOperatorType left, CustomOperatorType right) => !ReferenceEquals(left, right);

    public static implicit operator CustomOperatorType(string value) => new CustomOperatorType();
}
