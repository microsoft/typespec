/// <summary> To test a method property without a setter. </summary>
public string this[int p1]
{
    get
    {
        return "abc";
    }
}
// test comment
/// <summary> To test a method property with a setter. </summary>
public string this[int p2]
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
public string this[int p3]
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
