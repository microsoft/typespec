public void TestMethod(string foo)
{
    global::Sample.Argument.AssertNotNull(foo, nameof(foo));

    foo = "foo";
}
