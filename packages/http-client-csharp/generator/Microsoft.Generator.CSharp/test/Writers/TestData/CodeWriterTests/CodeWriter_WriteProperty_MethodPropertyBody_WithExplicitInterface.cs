/// <summary> To test an auto property without a setter. </summary>
public int global::System.Collections.Generic.IList<string>.Count
{
    get
    {
        return 299792458;
    }
}
// test comment
/// <summary> To test an auto property with a setter. </summary>
public bool global::System.Collections.Generic.IList<string>.IsReadOnly
{
    get
    {
        return true;
    }
    set
    {
        this.IsReadOnly = value;
    }
}
/// <summary> To test an auto property with an internal setter. </summary>
public int global::System.Collections.Generic.IReadOnlyList<string>.Count
{
    get
    {
        return 299792458;
    }
    internal set
    {
        this.Count = value;
    }
}
