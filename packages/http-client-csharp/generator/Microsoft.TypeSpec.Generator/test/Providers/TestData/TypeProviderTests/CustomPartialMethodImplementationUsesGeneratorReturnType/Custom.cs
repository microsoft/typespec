#nullable disable

namespace Test;

public partial class CustomPartialReturnType
{
    // CustomReturnModel is a type generated into the same assembly, so it is unresolved when this
    // declaration is read. The generated implementation must still use the generator's resolved
    // return type (with its namespace) rather than this unresolved one.
    static partial CustomReturnModel MyMethod(string input);
}
