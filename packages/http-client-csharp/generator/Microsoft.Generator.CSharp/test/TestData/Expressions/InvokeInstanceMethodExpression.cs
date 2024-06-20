/// <param name="p1"> p1. </param>
/// <param name="p2"> p2. </param>
/// <param name="p3"> p3. </param>
public bool Bar(bool p1, bool p2, bool p3)
{
    return true;
}
public bool Foo()
{
    return Bar(true, false, false);
}
