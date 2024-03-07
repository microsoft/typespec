using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Output.Models;
using NUnit.Framework;

namespace AutoRest.CSharp.Generation.Writers.Tests
{
    public class OptionalPropertyWritingTests : ModelGenerationTestBase
    {
        [TestCaseSource(nameof(RoundTripModelCase))]
        public void RoundTripModel(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/bed837a2e29e55569360206afa3393e044dfb070/packages/cadl-ranch-specs/http/models/optional-properties/main.cadl#L35-L38
            var model = new InputModelType("RoundTripModel", "Cadl.TestServer.OptionalProperties.Models", "public", null, "Round-trip model with optional properties.", InputModelTypeUsage.RoundTrip,
                    OptionalProperties, null, Array.Empty<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.OptionalProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { ElementModelType, model }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("RoundTripModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        [TestCaseSource(nameof(InputModelCase))]
        public void InputModel(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/bed837a2e29e55569360206afa3393e044dfb070/packages/cadl-ranch-specs/http/models/optional-properties/main.cadl#L15-L28
            var model = new InputModelType("InputModel", "Cadl.TestServer.OptionalProperties.Models", "public", null, "Input model with optional properties.", InputModelTypeUsage.Input,
                    OptionalProperties, null, Array.Empty<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.OptionalProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { ElementModelType, model }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("InputModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        [TestCaseSource(nameof(OutputModelCase))]
        public void OutputModel(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/bed837a2e29e55569360206afa3393e044dfb070/packages/cadl-ranch-specs/http/models/optional-properties/main.cadl#L30-L33
            var model = new InputModelType("OutputModel", "Cadl.TestServer.OptionalProperties.Models", "public", null, "Output model with optional properties.", InputModelTypeUsage.Output,
                    OptionalProperties, null, Array.Empty<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.OptionalProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { ElementModelType, model }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("OutputModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        private static readonly IReadOnlyList<InputModelProperty> OptionalProperties = new List<InputModelProperty>{
            new InputModelProperty("optionalString", "optionalString", "Optional string, illustrating an optional reference type property.", InputPrimitiveType.String, false, false, false),
            new InputModelProperty("optionalInt", "optionalInt", "Optional int, illustrating an optional reference type property.", InputPrimitiveType.Int32, false, false, false),
            new InputModelProperty("optionalStringList", "optionalStringList", "Optional string collection.", new InputListType("optionalStringList", InputPrimitiveType.String, false), false, false, false),
            new InputModelProperty("optionalIntList", "optionalIntList", "Optional int collection.", new InputListType("optionalIntList", InputPrimitiveType.Int32, false), false, false, false),
            new InputModelProperty("optionalModelCollection", "optionalModelCollection", "Optional collection of models.", new InputListType("optionalModelCollection", ElementModelType, false), false, false, false),
            new InputModelProperty("optionalModelDictionary", "optionalModelDictionary", "Optional dictionary of models.", new InputDictionaryType("optionalModelDictionary", InputPrimitiveType.String, ElementModelType, false), false, false, false)
        };

        // below are test cases
        private static readonly object[] RoundTripModelCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Collections.Generic;
using Azure.Core;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.OptionalProperties.Models
{
/// <summary> Round-trip model with optional properties. </summary>
public partial class RoundTripModel
{
/// <summary> Initializes a new instance of RoundTripModel. </summary>
public RoundTripModel()
{
OptionalStringList = new global::Azure.Core.ChangeTrackingList<string>();
OptionalIntList = new global::Azure.Core.ChangeTrackingList<int>();
OptionalModelCollection = new global::Azure.Core.ChangeTrackingList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
OptionalModelDictionary = new global::Azure.Core.ChangeTrackingDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
}
/// <summary> Initializes a new instance of RoundTripModel. </summary>
/// <param name=""optionalString""> Optional string, illustrating an optional reference type property. </param>
/// <param name=""optionalInt""> Optional int, illustrating an optional reference type property. </param>
/// <param name=""optionalStringList""> Optional string collection. </param>
/// <param name=""optionalIntList""> Optional int collection. </param>
/// <param name=""optionalModelCollection""> Optional collection of models. </param>
/// <param name=""optionalModelDictionary""> Optional dictionary of models. </param>
internal RoundTripModel(string optionalString,int? optionalInt,global::System.Collections.Generic.IList<string> optionalStringList,global::System.Collections.Generic.IList<int> optionalIntList,global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> optionalModelCollection,global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> optionalModelDictionary)
{
OptionalString = optionalString;
OptionalInt = optionalInt;
OptionalStringList = optionalStringList;
OptionalIntList = optionalIntList;
OptionalModelCollection = optionalModelCollection;
OptionalModelDictionary = optionalModelDictionary;
}

/// <summary> Optional string, illustrating an optional reference type property. </summary>
public string OptionalString{ get; set; }

/// <summary> Optional int, illustrating an optional reference type property. </summary>
public int? OptionalInt{ get; set; }

/// <summary> Optional string collection. </summary>
public global::System.Collections.Generic.IList<string> OptionalStringList{ get; }

/// <summary> Optional int collection. </summary>
public global::System.Collections.Generic.IList<int> OptionalIntList{ get; }

/// <summary> Optional collection of models. </summary>
public global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> OptionalModelCollection{ get; }

/// <summary> Optional dictionary of models. </summary>
public global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> OptionalModelDictionary{ get; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Collections.Generic;
using System.Text.Json;
using Azure;
using Azure.Core;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.OptionalProperties.Models
{
public partial class RoundTripModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
if (global::Azure.Core.Optional.IsDefined(OptionalString))
{
writer.WritePropertyName(""optionalString"");
writer.WriteStringValue(OptionalString);
}
if (global::Azure.Core.Optional.IsDefined(OptionalInt))
{
if (OptionalInt != null)
{
writer.WritePropertyName(""optionalInt"");
writer.WriteNumberValue(OptionalInt.Value);
}
else
{
writer.WriteNull(""optionalInt"");
}
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalStringList))
{
writer.WritePropertyName(""optionalStringList"");
writer.WriteStartArray();
foreach (var item in OptionalStringList)
{
writer.WriteStringValue(item);
}
writer.WriteEndArray();
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalIntList))
{
writer.WritePropertyName(""optionalIntList"");
writer.WriteStartArray();
foreach (var item in OptionalIntList)
{
writer.WriteNumberValue(item);
}
writer.WriteEndArray();
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalModelCollection))
{
writer.WritePropertyName(""optionalModelCollection"");
writer.WriteStartArray();
foreach (var item in OptionalModelCollection)
{
writer.WriteObjectValue(item);
}
writer.WriteEndArray();
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalModelDictionary))
{
writer.WritePropertyName(""optionalModelDictionary"");
writer.WriteStartObject();
foreach (var item in OptionalModelDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteObjectValue(item.Value);
}
writer.WriteEndObject();
}
writer.WriteEndObject();
}

internal static global::Cadl.TestServer.OptionalProperties.Models.RoundTripModel DeserializeRoundTripModel(global::System.Text.Json.JsonElement element)
{
global::Azure.Core.Optional<string> optionalString = default;
global::Azure.Core.Optional<int?> optionalInt = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IList<string>> optionalStringList = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IList<int>> optionalIntList = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> optionalModelCollection = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> optionalModelDictionary = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""optionalString"")){
optionalString = property.Value.GetString();
continue;
}
if(property.NameEquals(""optionalInt"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
optionalInt = null;
continue;}
optionalInt = property.Value.GetInt32();
continue;
}
if(property.NameEquals(""optionalStringList"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.List<string> array = new global::System.Collections.Generic.List<string>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetString());}
optionalStringList = array;
continue;
}
if(property.NameEquals(""optionalIntList"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.List<int> array = new global::System.Collections.Generic.List<int>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetInt32());}
optionalIntList = array;
continue;
}
if(property.NameEquals(""optionalModelCollection"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> array = new global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(item));}
optionalModelCollection = array;
continue;
}
if(property.NameEquals(""optionalModelDictionary"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> dictionary = new global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(property0.Value));}
optionalModelDictionary = dictionary;
continue;
}
}
return new global::Cadl.TestServer.OptionalProperties.Models.RoundTripModel(optionalString, global::Azure.Core.Optional.ToNullable(optionalInt), global::Azure.Core.Optional.ToList(optionalStringList), global::Azure.Core.Optional.ToList(optionalIntList), global::Azure.Core.Optional.ToList(optionalModelCollection), global::Azure.Core.Optional.ToDictionary(optionalModelDictionary));}

internal global::Azure.Core.RequestContent ToRequestContent()
{
var content = new global::Azure.Core.Utf8JsonRequestContent();
content.JsonWriter.WriteObjectValue(this);
return content;
}

internal static global::Cadl.TestServer.OptionalProperties.Models.RoundTripModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeRoundTripModel(document.RootElement);
}
}
}
"
            }
        };

        private static readonly object[] InputModelCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Collections.Generic;
using Azure.Core;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.OptionalProperties.Models
{
/// <summary> Input model with optional properties. </summary>
public partial class InputModel
{
/// <summary> Initializes a new instance of InputModel. </summary>
public InputModel()
{
OptionalStringList = new global::Azure.Core.ChangeTrackingList<string>();
OptionalIntList = new global::Azure.Core.ChangeTrackingList<int>();
OptionalModelCollection = new global::Azure.Core.ChangeTrackingList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
OptionalModelDictionary = new global::Azure.Core.ChangeTrackingDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
}

/// <summary> Optional string, illustrating an optional reference type property. </summary>
public string OptionalString{ get; set; }

/// <summary> Optional int, illustrating an optional reference type property. </summary>
public int? OptionalInt{ get; set; }

/// <summary> Optional string collection. </summary>
public global::System.Collections.Generic.IList<string> OptionalStringList{ get; }

/// <summary> Optional int collection. </summary>
public global::System.Collections.Generic.IList<int> OptionalIntList{ get; }

/// <summary> Optional collection of models. </summary>
public global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> OptionalModelCollection{ get; }

/// <summary> Optional dictionary of models. </summary>
public global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> OptionalModelDictionary{ get; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Text.Json;
using Azure.Core;

namespace Cadl.TestServer.OptionalProperties.Models
{
public partial class InputModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
if (global::Azure.Core.Optional.IsDefined(OptionalString))
{
writer.WritePropertyName(""optionalString"");
writer.WriteStringValue(OptionalString);
}
if (global::Azure.Core.Optional.IsDefined(OptionalInt))
{
if (OptionalInt != null)
{
writer.WritePropertyName(""optionalInt"");
writer.WriteNumberValue(OptionalInt.Value);
}
else
{
writer.WriteNull(""optionalInt"");
}
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalStringList))
{
writer.WritePropertyName(""optionalStringList"");
writer.WriteStartArray();
foreach (var item in OptionalStringList)
{
writer.WriteStringValue(item);
}
writer.WriteEndArray();
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalIntList))
{
writer.WritePropertyName(""optionalIntList"");
writer.WriteStartArray();
foreach (var item in OptionalIntList)
{
writer.WriteNumberValue(item);
}
writer.WriteEndArray();
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalModelCollection))
{
writer.WritePropertyName(""optionalModelCollection"");
writer.WriteStartArray();
foreach (var item in OptionalModelCollection)
{
writer.WriteObjectValue(item);
}
writer.WriteEndArray();
}
if (global::Azure.Core.Optional.IsCollectionDefined(OptionalModelDictionary))
{
writer.WritePropertyName(""optionalModelDictionary"");
writer.WriteStartObject();
foreach (var item in OptionalModelDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteObjectValue(item.Value);
}
writer.WriteEndObject();
}
writer.WriteEndObject();
}

internal global::Azure.Core.RequestContent ToRequestContent()
{
var content = new global::Azure.Core.Utf8JsonRequestContent();
content.JsonWriter.WriteObjectValue(this);
return content;
}
}
}
"
            }
        };

        private static readonly object[] OutputModelCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.OptionalProperties.Models
{
/// <summary> Output model with optional properties. </summary>
public partial class OutputModel
{
/// <summary> Initializes a new instance of OutputModel. </summary>
internal OutputModel()
{
OptionalStringList = global::System.Array.Empty<string>();
OptionalIntList = global::System.Array.Empty<int>();
OptionalModelCollection = global::System.Array.Empty<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
OptionalModelDictionary = new global::System.Collections.ObjectModel.ReadOnlyDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>(new global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>(0));
}
/// <summary> Initializes a new instance of OutputModel. </summary>
/// <param name=""optionalString""> Optional string, illustrating an optional reference type property. </param>
/// <param name=""optionalInt""> Optional int, illustrating an optional reference type property. </param>
/// <param name=""optionalStringList""> Optional string collection. </param>
/// <param name=""optionalIntList""> Optional int collection. </param>
/// <param name=""optionalModelCollection""> Optional collection of models. </param>
/// <param name=""optionalModelDictionary""> Optional dictionary of models. </param>
internal OutputModel(string optionalString,int? optionalInt,global::System.Collections.Generic.IReadOnlyList<string> optionalStringList,global::System.Collections.Generic.IReadOnlyList<int> optionalIntList,global::System.Collections.Generic.IReadOnlyList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> optionalModelCollection,global::System.Collections.Generic.IReadOnlyDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> optionalModelDictionary)
{
OptionalString = optionalString;
OptionalInt = optionalInt;
OptionalStringList = optionalStringList;
OptionalIntList = optionalIntList;
OptionalModelCollection = optionalModelCollection;
OptionalModelDictionary = optionalModelDictionary;
}

/// <summary> Optional string, illustrating an optional reference type property. </summary>
public string OptionalString{ get; }

/// <summary> Optional int, illustrating an optional reference type property. </summary>
public int? OptionalInt{ get; }

/// <summary> Optional string collection. </summary>
public global::System.Collections.Generic.IReadOnlyList<string> OptionalStringList{ get; }

/// <summary> Optional int collection. </summary>
public global::System.Collections.Generic.IReadOnlyList<int> OptionalIntList{ get; }

/// <summary> Optional collection of models. </summary>
public global::System.Collections.Generic.IReadOnlyList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> OptionalModelCollection{ get; }

/// <summary> Optional dictionary of models. </summary>
public global::System.Collections.Generic.IReadOnlyDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> OptionalModelDictionary{ get; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Collections.Generic;
using System.Text.Json;
using Azure;
using Azure.Core;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.OptionalProperties.Models
{
public partial class OutputModel
{
internal static global::Cadl.TestServer.OptionalProperties.Models.OutputModel DeserializeOutputModel(global::System.Text.Json.JsonElement element)
{
global::Azure.Core.Optional<string> optionalString = default;
global::Azure.Core.Optional<int?> optionalInt = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IReadOnlyList<string>> optionalStringList = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IReadOnlyList<int>> optionalIntList = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IReadOnlyList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> optionalModelCollection = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IReadOnlyDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> optionalModelDictionary = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""optionalString"")){
optionalString = property.Value.GetString();
continue;
}
if(property.NameEquals(""optionalInt"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
optionalInt = null;
continue;}
optionalInt = property.Value.GetInt32();
continue;
}
if(property.NameEquals(""optionalStringList"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.List<string> array = new global::System.Collections.Generic.List<string>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetString());}
optionalStringList = array;
continue;
}
if(property.NameEquals(""optionalIntList"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.List<int> array = new global::System.Collections.Generic.List<int>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetInt32());}
optionalIntList = array;
continue;
}
if(property.NameEquals(""optionalModelCollection"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> array = new global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(item));}
optionalModelCollection = array;
continue;
}
if(property.NameEquals(""optionalModelDictionary"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> dictionary = new global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(property0.Value));}
optionalModelDictionary = dictionary;
continue;
}
}
return new global::Cadl.TestServer.OptionalProperties.Models.OutputModel(optionalString, global::Azure.Core.Optional.ToNullable(optionalInt), global::Azure.Core.Optional.ToList(optionalStringList), global::Azure.Core.Optional.ToList(optionalIntList), global::Azure.Core.Optional.ToList(optionalModelCollection), global::Azure.Core.Optional.ToDictionary(optionalModelDictionary));}

internal static global::Cadl.TestServer.OptionalProperties.Models.OutputModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeOutputModel(document.RootElement);
}
}
}
"
            }
        };
    }
}
