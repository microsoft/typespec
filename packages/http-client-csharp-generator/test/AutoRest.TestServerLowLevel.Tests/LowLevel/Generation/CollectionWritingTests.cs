// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Types;
using NUnit.Framework;

namespace AutoRest.CSharp.Generation.Writers.Tests
{
    public class CollectionWritingTests : ModelGenerationTestBase
    {
        [TestCaseSource(nameof(RoundTripPrimitiveCollectionPropertiesCase))]
        public void RoundTripPrimitiveCollectionProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/main/packages/cadl-ranch-specs/http/models/primitive-properties/main.cadl
            var input = new InputModelType("RoundTripModel", "Cadl.TestServer.CollectionPropertiesBasic.Models", "public", null, "Round-trip model with collection properties", InputModelTypeUsage.RoundTrip,
                new List<InputModelProperty> { RequiredStringListProperty, RequiredIntListProperty },
                null, new List<InputModelType>(), null, null, null, false);

            var model = new ModelTypeProvider(input, "test", null, CadlTypeFactory);
            ValidateGeneratedCodes(model, expectedModelCodes, expectedSerializationCodes);
        }

        [TestCaseSource(nameof(InputPrimitiveCollectionPropertiesCase))]
        public void InputPrimitiveCollectionProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/main/packages/cadl-ranch-specs/http/models/collections-basic/main.cadl#L16-L24
            var input = new InputModelType("InputModel", "Cadl.TestServer.CollectionPropertiesBasic.Models", "public", null, "Input model with collection properties", InputModelTypeUsage.Input,
                new List<InputModelProperty> { RequiredStringListProperty, RequiredIntListProperty },
                null, new List<InputModelType>(), null, null, null, false);

            var model = new ModelTypeProvider(input, "test", null, CadlTypeFactory);
            ValidateGeneratedCodes(model, expectedModelCodes, expectedSerializationCodes);
        }

        [TestCaseSource(nameof(OutputPrimitiveCollectionPropertiesCase))]
        public void OutputPrimitiveCollectionProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/main/packages/cadl-ranch-specs/http/models/collections-basic/main.cadl#L26-L34
            var input = new InputModelType("OutputModel", "Cadl.TestServer.CollectionPropertiesBasic.Models", "public", null, "Output model with collection properties", InputModelTypeUsage.Output,
                new List<InputModelProperty> { RequiredStringListProperty, RequiredIntListProperty },
                null, new List<InputModelType>(), null, null, null, false);

            var model = new ModelTypeProvider(input, "test", null, CadlTypeFactory);
            ValidateGeneratedCodes(model, expectedModelCodes, expectedSerializationCodes);
        }

        [TestCaseSource(nameof(ModelTypeCollectionPropertiesCase))]
        public void ModelTypeCollectionProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/main/packages/cadl-ranch-specs/http/models/collections-models/main.cadl#L36-L44
            var elementModelType = new InputModelType("SimpleModel", "Cadl.TestServer.ModelCollectionProperties.Models", "public", null,
                    "Simple model that will appear in a collection.", InputModelTypeUsage.RoundTrip,
                    new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty },
                null, new List<InputModelType>(), null, null, null, false);
            var collectionModelType = new InputModelType("ModelCollectionModel", "Cadl.TestServer.ModelCollectionProperties.Models", "public", null,
                    "Simple model with model collection properties", InputModelTypeUsage.RoundTrip,
                new List<InputModelProperty>{
                        new InputModelProperty("requiredModelCollection", "requiredModelCollection", "Required collection of models.", new InputListType("requiredModelCollection", elementModelType, false), true, false, false),
                        new InputModelProperty("optionalModelCollection", "optionalModelCollection", "Optional collection of models.", new InputListType("optionalModelCollection", elementModelType, false), false, false, false),
                },
                null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.ModelCollectionProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { elementModelType, collectionModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("ModelCollectionModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        [TestCaseSource(nameof(ModelType2DCollectionPropertiesCase))]
        public void ModelType2DCollectionProperties(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/main/packages/cadl-ranch-specs/http/models/collections-models/main.cadl#L36-L44
            var elementModelType = new InputModelType("SimpleModel", "Cadl.TestServer.ModelCollectionProperties.Models", "public", null,
                    "Simple model that will appear in a collection.", InputModelTypeUsage.RoundTrip,
                    new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty },
                null, new List<InputModelType>(), null, null, null, false);
            var collectionModelType = new InputModelType("ModelCollectionModel", "Cadl.TestServer.ModelCollectionProperties.Models", "public", null,
                    "Simple model with model collection properties", InputModelTypeUsage.RoundTrip,
                new List<InputModelProperty>{
                        new InputModelProperty("required2DCollection", "required2DCollection", "Required collection of models.", new InputListType("required2DCollection", new InputListType("requiredModelCollection", elementModelType, false), false), true, false, false),
                        new InputModelProperty("optional2DCollection", "optional2DCollection", "Optional collection of models.", new InputListType("optional2DCollection", new InputListType("optionalModelCollection", elementModelType, false), false), false, false, false),
                },
                null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("Cadl.TestServer.ModelCollectionProperties.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { elementModelType, collectionModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("ModelCollectionModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        // below are test cases
        private static readonly object[] RoundTripPrimitiveCollectionPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using Azure.Core;

namespace Cadl.TestServer.CollectionPropertiesBasic.Models
{
/// <summary> Round-trip model with collection properties. </summary>
public partial class RoundTripModel
{
/// <summary> Initializes a new instance of RoundTripModel. </summary>
/// <param name=""requiredStringList""> Required collection of strings, illustrating a collection of reference types. </param>
/// <param name=""requiredIntList""> Required collection of ints, illustrating a collection of value types. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""requiredStringList""/> or <paramref name=""requiredIntList""/> is null. </exception>
public RoundTripModel(global::System.Collections.Generic.IEnumerable<string> requiredStringList,global::System.Collections.Generic.IEnumerable<int> requiredIntList)
{
global::Azure.Core.Argument.AssertNotNull(requiredStringList, nameof(requiredStringList));
global::Azure.Core.Argument.AssertNotNull(requiredIntList, nameof(requiredIntList));

RequiredStringList = requiredStringList.ToList();
RequiredIntList = requiredIntList.ToList();
}
/// <summary> Initializes a new instance of RoundTripModel. </summary>
/// <param name=""requiredStringList""> Required collection of strings, illustrating a collection of reference types. </param>
/// <param name=""requiredIntList""> Required collection of ints, illustrating a collection of value types. </param>
internal RoundTripModel(global::System.Collections.Generic.IList<string> requiredStringList,global::System.Collections.Generic.IList<int> requiredIntList)
{
RequiredStringList = requiredStringList;
RequiredIntList = requiredIntList;
}

/// <summary> Required collection of strings, illustrating a collection of reference types. </summary>
public global::System.Collections.Generic.IList<string> RequiredStringList{ get; }

/// <summary> Required collection of ints, illustrating a collection of value types. </summary>
public global::System.Collections.Generic.IList<int> RequiredIntList{ get; }
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

namespace Cadl.TestServer.CollectionPropertiesBasic.Models
{
public partial class RoundTripModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""requiredStringList"");
writer.WriteStartArray();
foreach (var item in RequiredStringList)
{
writer.WriteStringValue(item);
}
writer.WriteEndArray();
writer.WritePropertyName(""requiredIntList"");
writer.WriteStartArray();
foreach (var item in RequiredIntList)
{
writer.WriteNumberValue(item);
}
writer.WriteEndArray();
writer.WriteEndObject();
}

internal static global::Cadl.TestServer.CollectionPropertiesBasic.Models.RoundTripModel DeserializeRoundTripModel(global::System.Text.Json.JsonElement element)
{
global::System.Collections.Generic.IList<string> requiredStringList = default;
global::System.Collections.Generic.IList<int> requiredIntList = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""requiredStringList"")){
global::System.Collections.Generic.List<string> array = new global::System.Collections.Generic.List<string>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetString());}
requiredStringList = array;
continue;
}
if(property.NameEquals(""requiredIntList"")){
global::System.Collections.Generic.List<int> array = new global::System.Collections.Generic.List<int>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetInt32());}
requiredIntList = array;
continue;
}
}
return new global::Cadl.TestServer.CollectionPropertiesBasic.Models.RoundTripModel(requiredStringList, requiredIntList);}

internal global::Azure.Core.RequestContent ToRequestContent()
{
var content = new global::Azure.Core.Utf8JsonRequestContent();
content.JsonWriter.WriteObjectValue(this);
return content;
}

internal static global::Cadl.TestServer.CollectionPropertiesBasic.Models.RoundTripModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeRoundTripModel(document.RootElement);
}
}
}
"
            }
        };

        private static readonly object[] InputPrimitiveCollectionPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using Azure.Core;

namespace Cadl.TestServer.CollectionPropertiesBasic.Models
{
/// <summary> Input model with collection properties. </summary>
public partial class InputModel
{
/// <summary> Initializes a new instance of InputModel. </summary>
/// <param name=""requiredStringList""> Required collection of strings, illustrating a collection of reference types. </param>
/// <param name=""requiredIntList""> Required collection of ints, illustrating a collection of value types. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""requiredStringList""/> or <paramref name=""requiredIntList""/> is null. </exception>
public InputModel(global::System.Collections.Generic.IEnumerable<string> requiredStringList,global::System.Collections.Generic.IEnumerable<int> requiredIntList)
{
global::Azure.Core.Argument.AssertNotNull(requiredStringList, nameof(requiredStringList));
global::Azure.Core.Argument.AssertNotNull(requiredIntList, nameof(requiredIntList));

RequiredStringList = requiredStringList.ToList();
RequiredIntList = requiredIntList.ToList();
}

/// <summary> Required collection of strings, illustrating a collection of reference types. </summary>
public global::System.Collections.Generic.IList<string> RequiredStringList{ get; }

/// <summary> Required collection of ints, illustrating a collection of value types. </summary>
public global::System.Collections.Generic.IList<int> RequiredIntList{ get; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Text.Json;
using Azure.Core;

namespace Cadl.TestServer.CollectionPropertiesBasic.Models
{
public partial class InputModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""requiredStringList"");
writer.WriteStartArray();
foreach (var item in RequiredStringList)
{
writer.WriteStringValue(item);
}
writer.WriteEndArray();
writer.WritePropertyName(""requiredIntList"");
writer.WriteStartArray();
foreach (var item in RequiredIntList)
{
writer.WriteNumberValue(item);
}
writer.WriteEndArray();
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

        private static readonly object[] OutputPrimitiveCollectionPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using Azure.Core;

namespace Cadl.TestServer.CollectionPropertiesBasic.Models
{
/// <summary> Output model with collection properties. </summary>
public partial class OutputModel
{
/// <summary> Initializes a new instance of OutputModel. </summary>
/// <param name=""requiredStringList""> Required collection of strings, illustrating a collection of reference types. </param>
/// <param name=""requiredIntList""> Required collection of ints, illustrating a collection of value types. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""requiredStringList""/> or <paramref name=""requiredIntList""/> is null. </exception>
internal OutputModel(global::System.Collections.Generic.IEnumerable<string> requiredStringList,global::System.Collections.Generic.IEnumerable<int> requiredIntList)
{
global::Azure.Core.Argument.AssertNotNull(requiredStringList, nameof(requiredStringList));
global::Azure.Core.Argument.AssertNotNull(requiredIntList, nameof(requiredIntList));

RequiredStringList = requiredStringList.ToList();
RequiredIntList = requiredIntList.ToList();
}
/// <summary> Initializes a new instance of OutputModel. </summary>
/// <param name=""requiredStringList""> Required collection of strings, illustrating a collection of reference types. </param>
/// <param name=""requiredIntList""> Required collection of ints, illustrating a collection of value types. </param>
internal OutputModel(global::System.Collections.Generic.IReadOnlyList<string> requiredStringList,global::System.Collections.Generic.IReadOnlyList<int> requiredIntList)
{
RequiredStringList = requiredStringList;
RequiredIntList = requiredIntList;
}

/// <summary> Required collection of strings, illustrating a collection of reference types. </summary>
public global::System.Collections.Generic.IReadOnlyList<string> RequiredStringList{ get; }

/// <summary> Required collection of ints, illustrating a collection of value types. </summary>
public global::System.Collections.Generic.IReadOnlyList<int> RequiredIntList{ get; }
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

namespace Cadl.TestServer.CollectionPropertiesBasic.Models
{
public partial class OutputModel
{
internal static global::Cadl.TestServer.CollectionPropertiesBasic.Models.OutputModel DeserializeOutputModel(global::System.Text.Json.JsonElement element)
{
global::System.Collections.Generic.IReadOnlyList<string> requiredStringList = default;
global::System.Collections.Generic.IReadOnlyList<int> requiredIntList = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""requiredStringList"")){
global::System.Collections.Generic.List<string> array = new global::System.Collections.Generic.List<string>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetString());}
requiredStringList = array;
continue;
}
if(property.NameEquals(""requiredIntList"")){
global::System.Collections.Generic.List<int> array = new global::System.Collections.Generic.List<int>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(item.GetInt32());}
requiredIntList = array;
continue;
}
}
return new global::Cadl.TestServer.CollectionPropertiesBasic.Models.OutputModel(requiredStringList, requiredIntList);}

internal static global::Cadl.TestServer.CollectionPropertiesBasic.Models.OutputModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeOutputModel(document.RootElement);
}
}
}
"
            }
        };

        private static readonly object[] ModelTypeCollectionPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using Azure.Core;

namespace Cadl.TestServer.ModelCollectionProperties.Models
{
/// <summary> Simple model with model collection properties. </summary>
public partial class ModelCollectionModel
{
/// <summary> Initializes a new instance of ModelCollectionModel. </summary>
/// <param name=""requiredModelCollection""> Required collection of models. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""requiredModelCollection""/> is null. </exception>
public ModelCollectionModel(global::System.Collections.Generic.IEnumerable<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelCollection)
{
global::Azure.Core.Argument.AssertNotNull(requiredModelCollection, nameof(requiredModelCollection));

RequiredModelCollection = requiredModelCollection.ToList();
OptionalModelCollection = new global::Azure.Core.ChangeTrackingList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
}
/// <summary> Initializes a new instance of ModelCollectionModel. </summary>
/// <param name=""requiredModelCollection""> Required collection of models. </param>
/// <param name=""optionalModelCollection""> Optional collection of models. </param>
internal ModelCollectionModel(global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelCollection,global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> optionalModelCollection)
{
RequiredModelCollection = requiredModelCollection;
OptionalModelCollection = optionalModelCollection;
}

/// <summary> Required collection of models. </summary>
public global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> RequiredModelCollection{ get; }

/// <summary> Optional collection of models. </summary>
public global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> OptionalModelCollection{ get; }
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

namespace Cadl.TestServer.ModelCollectionProperties.Models
{
public partial class ModelCollectionModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""requiredModelCollection"");
writer.WriteStartArray();
foreach (var item in RequiredModelCollection)
{
writer.WriteObjectValue(item);
}
writer.WriteEndArray();
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
writer.WriteEndObject();
}

internal static global::Cadl.TestServer.ModelCollectionProperties.Models.ModelCollectionModel DeserializeModelCollectionModel(global::System.Text.Json.JsonElement element)
{
global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> requiredModelCollection = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> optionalModelCollection = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""requiredModelCollection"")){
global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> array = new global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var item in property.Value.EnumerateArray())
{
array.Add(global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(item));}
requiredModelCollection = array;
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
}
return new global::Cadl.TestServer.ModelCollectionProperties.Models.ModelCollectionModel(requiredModelCollection, global::Azure.Core.Optional.ToList(optionalModelCollection));}

internal global::Azure.Core.RequestContent ToRequestContent()
{
var content = new global::Azure.Core.Utf8JsonRequestContent();
content.JsonWriter.WriteObjectValue(this);
return content;
}

internal static global::Cadl.TestServer.ModelCollectionProperties.Models.ModelCollectionModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeModelCollectionModel(document.RootElement);
}
}
}
"
            }
        };

        private static readonly object[] ModelType2DCollectionPropertiesCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using Azure.Core;

namespace Cadl.TestServer.ModelCollectionProperties.Models
{
/// <summary> Simple model with model collection properties. </summary>
public partial class ModelCollectionModel
{
/// <summary> Initializes a new instance of ModelCollectionModel. </summary>
/// <param name=""required2DCollection""> Required collection of models. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""required2DCollection""/> is null. </exception>
public ModelCollectionModel(global::System.Collections.Generic.IEnumerable<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> required2DCollection)
{
global::Azure.Core.Argument.AssertNotNull(required2DCollection, nameof(required2DCollection));

Required2DCollection = required2DCollection.ToList();
Optional2DCollection = new global::Azure.Core.ChangeTrackingList<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>();
}
/// <summary> Initializes a new instance of ModelCollectionModel. </summary>
/// <param name=""required2DCollection""> Required collection of models. </param>
/// <param name=""optional2DCollection""> Optional collection of models. </param>
internal ModelCollectionModel(global::System.Collections.Generic.IList<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> required2DCollection,global::System.Collections.Generic.IList<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> optional2DCollection)
{
Required2DCollection = required2DCollection;
Optional2DCollection = optional2DCollection;
}

/// <summary> Required collection of models. </summary>
public global::System.Collections.Generic.IList<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> Required2DCollection{ get; }

/// <summary> Optional collection of models. </summary>
public global::System.Collections.Generic.IList<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> Optional2DCollection{ get; }
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

namespace Cadl.TestServer.ModelCollectionProperties.Models
{
public partial class ModelCollectionModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""required2DCollection"");
writer.WriteStartArray();
foreach (var item in Required2DCollection)
{
writer.WriteStartArray();
foreach (var item0 in item)
{
writer.WriteObjectValue(item0);
}
writer.WriteEndArray();
}
writer.WriteEndArray();
if (global::Azure.Core.Optional.IsCollectionDefined(Optional2DCollection))
{
writer.WritePropertyName(""optional2DCollection"");
writer.WriteStartArray();
foreach (var item in Optional2DCollection)
{
writer.WriteStartArray();
foreach (var item0 in item)
{
writer.WriteObjectValue(item0);
}
writer.WriteEndArray();
}
writer.WriteEndArray();
}
writer.WriteEndObject();
}

internal static global::Cadl.TestServer.ModelCollectionProperties.Models.ModelCollectionModel DeserializeModelCollectionModel(global::System.Text.Json.JsonElement element)
{
global::System.Collections.Generic.IList<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> required2DCollection = default;
global::Azure.Core.Optional<global::System.Collections.Generic.IList<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>> optional2DCollection = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""required2DCollection"")){
global::System.Collections.Generic.List<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> array = new global::System.Collections.Generic.List<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>();
foreach (var item in property.Value.EnumerateArray())
{
global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> array0 = new global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var item0 in item.EnumerateArray())
{
array0.Add(global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(item0));}
array.Add(array0);}
required2DCollection = array;
continue;
}
if(property.NameEquals(""optional2DCollection"")){
if (property.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null)
{
property.ThrowNonNullablePropertyIsNull();
continue;}
global::System.Collections.Generic.List<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>> array = new global::System.Collections.Generic.List<global::System.Collections.Generic.IList<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>>();
foreach (var item in property.Value.EnumerateArray())
{
global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel> array0 = new global::System.Collections.Generic.List<global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel>();
foreach (var item0 in item.EnumerateArray())
{
array0.Add(global::Cadl.TestServer.ModelCollectionProperties.Models.SimpleModel.DeserializeSimpleModel(item0));}
array.Add(array0);}
optional2DCollection = array;
continue;
}
}
return new global::Cadl.TestServer.ModelCollectionProperties.Models.ModelCollectionModel(required2DCollection, global::Azure.Core.Optional.ToList(optional2DCollection));}

internal global::Azure.Core.RequestContent ToRequestContent()
{
var content = new global::Azure.Core.Utf8JsonRequestContent();
content.JsonWriter.WriteObjectValue(this);
return content;
}

internal static global::Cadl.TestServer.ModelCollectionProperties.Models.ModelCollectionModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeModelCollectionModel(document.RootElement);
}
}
}
"
            }
        };
    }
}
