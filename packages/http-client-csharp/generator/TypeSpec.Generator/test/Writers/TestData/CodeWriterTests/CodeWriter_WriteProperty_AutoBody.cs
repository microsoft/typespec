/// <summary> To test an auto property without a setter. </summary>
public string Property1 { get; }
// test comment
/// <summary> To test an auto property with a setter. </summary>
public string Property2 { get; set; }
/// <summary> To test an auto property with an internal setter. </summary>
public string Property3 { get; internal set; }
/// <summary> To test an auto property with an internal setter and initialization value. </summary>
public string Property4 { get; internal set; } = "abc";
