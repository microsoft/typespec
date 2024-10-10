using Sample;
using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Customization;

namespace Sample.Models;

[CodeGenSerialization(nameof(Prop1), DeserializationValueHook = nameof(DeserializationMethod))]
public partial class BaseModel
{
    internal string Prop1 { get; set; }

    private static void DeserializationMethod(JsonProperty property, ref string fieldValue)
            => fieldValue = property.Value.GetString();
}
