/// <summary> Test constructor with suppressions. </summary>
/// <param name="value"> The integer value. </param>
#pragma warning disable CS0618 // Using obsolete method for testing
public TestName(int value)
{
    value = this.Value;
}
#pragma warning restore CS0618 // Using obsolete method for testing
