using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Output.Models;
using NUnit.Framework;

namespace AutoRest.CSharp.Generation.Writers.Tests
{
    public class DictionaryWritingTests : ModelGenerationTestBase
    {

        [TestCaseSource(nameof(RoundTripDictionaryPropertiesCase))]
        public void RoundTripDictionaryProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            var model = new InputModelType("RoundTripModel", "Cadl.TestServer.DictionaryProperties.Models", "public", null, "Round-trip model with dictionary properties", InputModelTypeUsage.RoundTrip,
                DictionaryProperties, null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.DictionaryProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { model, ElementModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("RoundTripModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        [TestCaseSource(nameof(InputDictionaryPropertiesCase))]
        public void InputDictionaryProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            var model = new InputModelType("InputModel", "Cadl.TestServer.DictionaryProperties.Models", "public", null, "Input model with dictionary properties", InputModelTypeUsage.Input,
                DictionaryProperties, null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.DictionaryProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { model, ElementModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("InputModel", expectedModelCodes, expectedSerializationCodes, library);

        }

        [TestCaseSource(nameof(OutputDictionaryPropertiesCase))]
        public void OutputDictionaryProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            var model = new InputModelType("OutputModel", "Cadl.TestServer.DictionaryProperties.Models", "public", null, "Output model with dictionary properties", InputModelTypeUsage.Output,
                DictionaryProperties, null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.DictionaryProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { model, ElementModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("OutputModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        private static readonly IReadOnlyList<InputModelProperty> DictionaryProperties = new List<InputModelProperty>
        {
            new InputModelProperty("requiredStringDictionary", "requiredStringDictionary", "Required dictionary of strings, illustrating a dictionary of reference types.", new InputDictionaryType("requiredStringDictionary", InputPrimitiveType.String, InputPrimitiveType.String, false), true, false, false),
            new InputModelProperty("requiredIntDictionary", "requiredIntDictionary", "Required dictionary of ints, illustrating a dictionary of value types.", new InputDictionaryType("requiredIntDictionary", InputPrimitiveType.String, InputPrimitiveType.Int32, false), true, false, false),
            new InputModelProperty("requiredModelDictionary", "requiredModelDictionary", "Required dictionary of models, illustrating a dictionary of model types.", new InputDictionaryType("requiredIntDictionary", InputPrimitiveType.String, ElementModelType, false), true, false, false),
            new InputModelProperty("requiredModelDictionaryDictionary", "requiredModelDictionaryDictionary", "Required dictionary of dictionary of models, illustrating a dictionary of dictionary types.",
                    new InputDictionaryType("requiredModelDictionaryDictionary", InputPrimitiveType.String, new InputDictionaryType("requiredModelDictionary", InputPrimitiveType.String, ElementModelType, false), false), true, false, false),
            new InputModelProperty("requiredModelListDictionary", "requiredModelListDictionary", "Required dictionary of list of models, illustrating a dictionary of list types.",
                    new InputDictionaryType("requiredModelListDictionary", InputPrimitiveType.String, new InputListType("requiredModelList", ElementModelType, false), false), true, false, false)
        };

        // below are test cases
        private static readonly object[] RoundTripDictionaryPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using Azure.Core;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.DictionaryProperties.Models
{
/// <summary> Round-trip model with dictionary properties. </summary>
public partial class RoundTripModel
{
/// <summary> Initializes a new instance of RoundTripModel. </summary>
/// <param name=""requiredStringDictionary""> Required dictionary of strings, illustrating a dictionary of reference types. </param>
/// <param name=""requiredIntDictionary""> Required dictionary of ints, illustrating a dictionary of value types. </param>
/// <param name=""requiredModelDictionary""> Required dictionary of models, illustrating a dictionary of model types. </param>
/// <param name=""requiredModelDictionaryDictionary""> Required dictionary of dictionary of models, illustrating a dictionary of dictionary types. </param>
/// <param name=""requiredModelListDictionary""> Required dictionary of list of models, illustrating a dictionary of list types. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""requiredStringDictionary""/>, <paramref name=""requiredIntDictionary""/>, <paramref name=""requiredModelDictionary""/>, <paramref name=""requiredModelDictionaryDictionary""/> or <paramref name=""requiredModelListDictionary""/> is null. </exception>
public RoundTripModel(global::System.Collections.Generic.IDictionary<string, string> requiredStringDictionary,global::System.Collections.Generic.IDictionary<string, int> requiredIntDictionary,global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelDictionary,global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelDictionaryDictionary,global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelListDictionary)
{
global::Azure.Core.Argument.AssertNotNull(requiredStringDictionary, nameof(requiredStringDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredIntDictionary, nameof(requiredIntDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelDictionary, nameof(requiredModelDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelDictionaryDictionary, nameof(requiredModelDictionaryDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelListDictionary, nameof(requiredModelListDictionary));

RequiredStringDictionary = requiredStringDictionary;
RequiredIntDictionary = requiredIntDictionary;
RequiredModelDictionary = requiredModelDictionary;
RequiredModelDictionaryDictionary = requiredModelDictionaryDictionary;
RequiredModelListDictionary = requiredModelListDictionary;
}

/// <summary> Required dictionary of strings, illustrating a dictionary of reference types. </summary>
public global::System.Collections.Generic.IDictionary<string, string> RequiredStringDictionary{ get; }

/// <summary> Required dictionary of ints, illustrating a dictionary of value types. </summary>
public global::System.Collections.Generic.IDictionary<string, int> RequiredIntDictionary{ get; }

/// <summary> Required dictionary of models, illustrating a dictionary of model types. </summary>
public global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> RequiredModelDictionary{ get; }

/// <summary> Required dictionary of dictionary of models, illustrating a dictionary of dictionary types. </summary>
public global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> RequiredModelDictionaryDictionary{ get; }

/// <summary> Required dictionary of list of models, illustrating a dictionary of list types. </summary>
public global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> RequiredModelListDictionary{ get; }
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

namespace Cadl.TestServer.DictionaryProperties.Models
{
public partial class RoundTripModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""requiredStringDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredStringDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteStringValue(item.Value);
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredIntDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredIntDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteNumberValue(item.Value);
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredModelDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredModelDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteObjectValue(item.Value);
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredModelDictionaryDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredModelDictionaryDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteStartObject();
foreach (var item0 in item.Value)
{
writer.WritePropertyName(item0.Key);
writer.WriteObjectValue(item0.Value);
}
writer.WriteEndObject();
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredModelListDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredModelListDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteStartArray();
foreach (var item0 in item.Value)
{
writer.WriteObjectValue(item0);
}
writer.WriteEndArray();
}
writer.WriteEndObject();
writer.WriteEndObject();
}

internal static global::Cadl.TestServer.DictionaryProperties.Models.RoundTripModel DeserializeRoundTripModel(global::System.Text.Json.JsonElement element)
{
global::System.Collections.Generic.IDictionary<string, string> requiredStringDictionary = default;
global::System.Collections.Generic.IDictionary<string, int> requiredIntDictionary = default;
global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelDictionary = default;
global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelDictionaryDictionary = default;
global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelListDictionary = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""requiredStringDictionary"")){
global::System.Collections.Generic.Dictionary<string, string> dictionary = new global::System.Collections.Generic.Dictionary<string, string>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, property0.Value.GetString());}
requiredStringDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredIntDictionary"")){
global::System.Collections.Generic.Dictionary<string, int> dictionary = new global::System.Collections.Generic.Dictionary<string, int>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, property0.Value.GetInt32());}
requiredIntDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredModelDictionary"")){
global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> dictionary = new global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(property0.Value));}
requiredModelDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredModelDictionaryDictionary"")){
global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> dictionary = new global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>();
foreach (var property0 in property.Value.EnumerateObject())
{
global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> dictionary0 = new global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var property1 in property0.Value.EnumerateObject())
{
dictionary0.Add(property1.Name, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(property1.Value));}
dictionary.Add(property0.Name, dictionary0);}
requiredModelDictionaryDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredModelListDictionary"")){
global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> dictionary = new global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>();
foreach (var property0 in property.Value.EnumerateObject())
{
global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> array = new global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var item in property0.Value.EnumerateArray())
{
array.Add(global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(item));}
dictionary.Add(property0.Name, array);}
requiredModelListDictionary = dictionary;
continue;
}
}
return new global::Cadl.TestServer.DictionaryProperties.Models.RoundTripModel(requiredStringDictionary, requiredIntDictionary, requiredModelDictionary, requiredModelDictionaryDictionary, requiredModelListDictionary);}

internal global::Azure.Core.RequestContent ToRequestContent()
{
var content = new global::Azure.Core.Utf8JsonRequestContent();
content.JsonWriter.WriteObjectValue(this);
return content;
}

internal static global::Cadl.TestServer.DictionaryProperties.Models.RoundTripModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeRoundTripModel(document.RootElement);
}
}
}
"
            }
        };

        private static readonly object[] InputDictionaryPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using Azure.Core;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.DictionaryProperties.Models
{
/// <summary> Input model with dictionary properties. </summary>
public partial class InputModel
{
/// <summary> Initializes a new instance of InputModel. </summary>
/// <param name=""requiredStringDictionary""> Required dictionary of strings, illustrating a dictionary of reference types. </param>
/// <param name=""requiredIntDictionary""> Required dictionary of ints, illustrating a dictionary of value types. </param>
/// <param name=""requiredModelDictionary""> Required dictionary of models, illustrating a dictionary of model types. </param>
/// <param name=""requiredModelDictionaryDictionary""> Required dictionary of dictionary of models, illustrating a dictionary of dictionary types. </param>
/// <param name=""requiredModelListDictionary""> Required dictionary of list of models, illustrating a dictionary of list types. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""requiredStringDictionary""/>, <paramref name=""requiredIntDictionary""/>, <paramref name=""requiredModelDictionary""/>, <paramref name=""requiredModelDictionaryDictionary""/> or <paramref name=""requiredModelListDictionary""/> is null. </exception>
public InputModel(global::System.Collections.Generic.IDictionary<string, string> requiredStringDictionary,global::System.Collections.Generic.IDictionary<string, int> requiredIntDictionary,global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelDictionary,global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelDictionaryDictionary,global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelListDictionary)
{
global::Azure.Core.Argument.AssertNotNull(requiredStringDictionary, nameof(requiredStringDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredIntDictionary, nameof(requiredIntDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelDictionary, nameof(requiredModelDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelDictionaryDictionary, nameof(requiredModelDictionaryDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelListDictionary, nameof(requiredModelListDictionary));

RequiredStringDictionary = requiredStringDictionary;
RequiredIntDictionary = requiredIntDictionary;
RequiredModelDictionary = requiredModelDictionary;
RequiredModelDictionaryDictionary = requiredModelDictionaryDictionary;
RequiredModelListDictionary = requiredModelListDictionary;
}

/// <summary> Required dictionary of strings, illustrating a dictionary of reference types. </summary>
public global::System.Collections.Generic.IDictionary<string, string> RequiredStringDictionary{ get; }

/// <summary> Required dictionary of ints, illustrating a dictionary of value types. </summary>
public global::System.Collections.Generic.IDictionary<string, int> RequiredIntDictionary{ get; }

/// <summary> Required dictionary of models, illustrating a dictionary of model types. </summary>
public global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> RequiredModelDictionary{ get; }

/// <summary> Required dictionary of dictionary of models, illustrating a dictionary of dictionary types. </summary>
public global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> RequiredModelDictionaryDictionary{ get; }

/// <summary> Required dictionary of list of models, illustrating a dictionary of list types. </summary>
public global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> RequiredModelListDictionary{ get; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Text.Json;
using Azure.Core;

namespace Cadl.TestServer.DictionaryProperties.Models
{
public partial class InputModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""requiredStringDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredStringDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteStringValue(item.Value);
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredIntDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredIntDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteNumberValue(item.Value);
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredModelDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredModelDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteObjectValue(item.Value);
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredModelDictionaryDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredModelDictionaryDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteStartObject();
foreach (var item0 in item.Value)
{
writer.WritePropertyName(item0.Key);
writer.WriteObjectValue(item0.Value);
}
writer.WriteEndObject();
}
writer.WriteEndObject();
writer.WritePropertyName(""requiredModelListDictionary"");
writer.WriteStartObject();
foreach (var item in RequiredModelListDictionary)
{
writer.WritePropertyName(item.Key);
writer.WriteStartArray();
foreach (var item0 in item.Value)
{
writer.WriteObjectValue(item0);
}
writer.WriteEndArray();
}
writer.WriteEndObject();
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

        private static readonly object[] OutputDictionaryPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using Azure.Core;
using Cadl.TestServer.ModelCollectionProperties.Models;

namespace Cadl.TestServer.DictionaryProperties.Models
{
/// <summary> Output model with dictionary properties. </summary>
public partial class OutputModel
{
/// <summary> Initializes a new instance of OutputModel. </summary>
/// <param name=""requiredStringDictionary""> Required dictionary of strings, illustrating a dictionary of reference types. </param>
/// <param name=""requiredIntDictionary""> Required dictionary of ints, illustrating a dictionary of value types. </param>
/// <param name=""requiredModelDictionary""> Required dictionary of models, illustrating a dictionary of model types. </param>
/// <param name=""requiredModelDictionaryDictionary""> Required dictionary of dictionary of models, illustrating a dictionary of dictionary types. </param>
/// <param name=""requiredModelListDictionary""> Required dictionary of list of models, illustrating a dictionary of list types. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""requiredStringDictionary""/>, <paramref name=""requiredIntDictionary""/>, <paramref name=""requiredModelDictionary""/>, <paramref name=""requiredModelDictionaryDictionary""/> or <paramref name=""requiredModelListDictionary""/> is null. </exception>
internal OutputModel(global::System.Collections.Generic.IReadOnlyDictionary<string, string> requiredStringDictionary,global::System.Collections.Generic.IReadOnlyDictionary<string, int> requiredIntDictionary,global::System.Collections.Generic.IReadOnlyDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelDictionary,global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelDictionaryDictionary,global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelListDictionary)
{
global::Azure.Core.Argument.AssertNotNull(requiredStringDictionary, nameof(requiredStringDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredIntDictionary, nameof(requiredIntDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelDictionary, nameof(requiredModelDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelDictionaryDictionary, nameof(requiredModelDictionaryDictionary));
global::Azure.Core.Argument.AssertNotNull(requiredModelListDictionary, nameof(requiredModelListDictionary));

RequiredStringDictionary = requiredStringDictionary;
RequiredIntDictionary = requiredIntDictionary;
RequiredModelDictionary = requiredModelDictionary;
RequiredModelDictionaryDictionary = requiredModelDictionaryDictionary;
RequiredModelListDictionary = requiredModelListDictionary;
}

/// <summary> Required dictionary of strings, illustrating a dictionary of reference types. </summary>
public global::System.Collections.Generic.IReadOnlyDictionary<string, string> RequiredStringDictionary{ get; }

/// <summary> Required dictionary of ints, illustrating a dictionary of value types. </summary>
public global::System.Collections.Generic.IReadOnlyDictionary<string, int> RequiredIntDictionary{ get; }

/// <summary> Required dictionary of models, illustrating a dictionary of model types. </summary>
public global::System.Collections.Generic.IReadOnlyDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> RequiredModelDictionary{ get; }

/// <summary> Required dictionary of dictionary of models, illustrating a dictionary of dictionary types. </summary>
public global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> RequiredModelDictionaryDictionary{ get; }

/// <summary> Required dictionary of list of models, illustrating a dictionary of list types. </summary>
public global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> RequiredModelListDictionary{ get; }
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

namespace Cadl.TestServer.DictionaryProperties.Models
{
public partial class OutputModel
{
internal static global::Cadl.TestServer.DictionaryProperties.Models.OutputModel DeserializeOutputModel(global::System.Text.Json.JsonElement element)
{
global::System.Collections.Generic.IReadOnlyDictionary<string, string> requiredStringDictionary = default;
global::System.Collections.Generic.IReadOnlyDictionary<string, int> requiredIntDictionary = default;
global::System.Collections.Generic.IReadOnlyDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelDictionary = default;
global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelDictionaryDictionary = default;
global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> requiredModelListDictionary = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""requiredStringDictionary"")){
global::System.Collections.Generic.Dictionary<string, string> dictionary = new global::System.Collections.Generic.Dictionary<string, string>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, property0.Value.GetString());}
requiredStringDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredIntDictionary"")){
global::System.Collections.Generic.Dictionary<string, int> dictionary = new global::System.Collections.Generic.Dictionary<string, int>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, property0.Value.GetInt32());}
requiredIntDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredModelDictionary"")){
global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> dictionary = new global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var property0 in property.Value.EnumerateObject())
{
dictionary.Add(property0.Name, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(property0.Value));}
requiredModelDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredModelDictionaryDictionary"")){
global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> dictionary = new global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IDictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>();
foreach (var property0 in property.Value.EnumerateObject())
{
global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> dictionary0 = new global::System.Collections.Generic.Dictionary<string, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var property1 in property0.Value.EnumerateObject())
{
dictionary0.Add(property1.Name, global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(property1.Value));}
dictionary.Add(property0.Name, dictionary0);}
requiredModelDictionaryDictionary = dictionary;
continue;
}
if(property.NameEquals(""requiredModelListDictionary"")){
global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> dictionary = new global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>();
foreach (var property0 in property.Value.EnumerateObject())
{
global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> array = new global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var item in property0.Value.EnumerateArray())
{
array.Add(global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(item));}
dictionary.Add(property0.Name, array);}
requiredModelListDictionary = dictionary;
continue;
}
}
return new global::Cadl.TestServer.DictionaryProperties.Models.OutputModel(requiredStringDictionary, requiredIntDictionary, requiredModelDictionary, requiredModelDictionaryDictionary, requiredModelListDictionary);}

internal static global::Cadl.TestServer.DictionaryProperties.Models.OutputModel FromResponse(global::Azure.Response response)
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
