using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Microsoft.Generator.CSharp.Customization;

#nullable disable

namespace Sample.Models;

[CodeGenSuppress("MockInputModel", typeof(string), typeof(IDictionary<string, BinaryData>))]
public partial class MockInputModel
{
    private readonly IReadOnlyList<MockInputModel> _data;

    internal MockInputModel(IReadOnlyList<MockInputModel> data, string prop1, IDictionary<string, BinaryData> additionalBinaryDataProperties)
    {
        Prop1 = prop1;
        _data = data;
        _additionalBinaryDataProperties = additionalBinaryDataProperties;
    }
}
