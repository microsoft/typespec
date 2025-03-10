public bool Foo()
{
    bool foo = true;
    switch (foo)
    {
        case true:
            using (var x = new global::System.IO.MemoryStream())
            {
                // some comment explaining the return
                return foo;
            }
        default:
            return false;
    }
}
