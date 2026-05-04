/// <summary> Test constructor with body expression and suppressions. </summary>
/// <param name="message"> The message value. </param>
#pragma warning disable CS0618 // Using obsolete constructor for testing
public TestName(string message) => throw new global::System.NotImplementedException(message);
#pragma warning restore CS0618 // Using obsolete constructor for testing
