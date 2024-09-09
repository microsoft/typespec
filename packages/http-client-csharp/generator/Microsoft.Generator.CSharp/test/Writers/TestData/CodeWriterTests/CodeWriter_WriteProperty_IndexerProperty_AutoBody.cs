/// <summary> To test an auto property without a setter. </summary>
public float this[int p1] { get; }
// test comment
/// <summary> To test an auto property with a setter. </summary>
public bool this[string p2] { get; set; }
/// <summary> To test an auto property with an internal setter. </summary>
public double this[float p3] { get; internal set; }
/// <summary> To test an auto property with an internal setter and initialization value. </summary>
public string this[double p4] { get; internal set; } = "abc";
