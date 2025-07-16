public void Foo()
{
    global::System.Collections.Generic.Dictionary<string, object>[] flows = new global::System.Collections.Generic.Dictionary<string, object>[] 
    {
        new global::System.Collections.Generic.Dictionary<string, object>
        {
            { "Scopes", new string[] { "scope1", "scope2" } },
            { "TokenUrl", "https://example.com/token" },
            { "AuthorizationUrl", "https://example.com/auth" }
        },
        new global::System.Collections.Generic.Dictionary<string, object>
        {
            { "Scopes", new string[] { "scope3" } },
            { "TokenUrl", "https://example2.com/token" }
        }
    };
}
