using SampleTypeSpec;

namespace Sample.Models;

public partial class MockInputModel
{
    internal MockInputModel()
    {
    }

    internal MockInputModel(string prop1, SubModel? subModel, IDictionary<string, BinaryData> serializedAdditionalRawData)
    {
    }
}

public readonly partial struct SubModel
{
}
