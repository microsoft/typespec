namespace Test
{
    public static class ExtensionOverloadType
    {
        public static string GetData(this object client, int param1) => "foo";
    }
}
