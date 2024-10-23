/// <summary> To test an auto property without a setter. </summary>
public string Property1
{
    get
    {
        return "abc";
    }
}
// test comment
/// <summary> To test an auto property with a setter. </summary>
public string Property2
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
/// <summary> To test an auto property with an internal setter. </summary>
public string Property3
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
