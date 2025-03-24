/// <summary> To test a method property without a setter. </summary>
public string global::System.Collections.Generic.IReadOnlyList<string>.this[int index]
{
    get
    {
        return "abc";
    }
}
// test comment
/// <summary> To test a method property with a setter. </summary>
public string global::System.Collections.Generic.IList<string>.this[int index]
{
    get
    {
        return "abc";
    }
    set
    {
        this.Property2 = value;
    }
}
/// <summary> To test a method property with an internal setter. </summary>
public string global::System.Collections.Generic.IReadOnlyDictionary<int, string>.this[int index]
{
    get
    {
        return "abc";
    }
    internal set
    {
        this.Property3 = value;
    }
}
