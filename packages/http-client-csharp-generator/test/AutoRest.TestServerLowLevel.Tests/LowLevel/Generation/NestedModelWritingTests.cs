using System;
using System.Collections.Generic;
using System.Text;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Writers.Tests;
using AutoRest.CSharp.Output.Models;
using NUnit.Framework;

namespace AutoRest.TestServerLowLevel.Tests.LowLevel.Generation
{
    public class NestedModelWritingTests : ModelGenerationTestBase
    {
        [TestCaseSource(nameof(RoundTripCase))]
        public void RoundTripModel(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/7435655e82b732b3573379f76e0e613423d244e9/packages/cadl-ranch-specs/http/models/nested-models/main.cadl#L60-L67
            var model = new InputModelType("RoundTripModel", "NestedModelsBasic.Models", "public", null, "Round-trip model with nested model properties", InputModelTypeUsage.RoundTrip,
                new List<InputModelProperty>
                {
                    new InputModelProperty("NestedRoundTripModel", "NestedRoundTripModel", "Required nested round-trip model.", NestedRoundTripOnlyModelType, true, false, false),
                    NestedRoundTripSharedModelProperty
                },
                null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("NestedModelsBasic.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { model, NestedRoundTripOnlyModelType, NestedRoundTripSharedModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("RoundTripModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        [TestCaseSource(nameof(InputCase))]
        public void InputModel(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/7435655e82b732b3573379f76e0e613423d244e9/packages/cadl-ranch-specs/http/models/nested-models/main.cadl#L42-L49
            var model = new InputModelType("InputModel", "NestedModelsBasic.Models", "public", null, "Input model with nested model properties", InputModelTypeUsage.Input,
                new List<InputModelProperty>
                {
                    new InputModelProperty("NestedInputModel", "NestedInputModel", "Required nested input model.", NestedInputOnlyModelType, true, false, false),
                    NestedRoundTripSharedModelProperty
                },
                null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("NestedModelsBasic.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { model, NestedInputOnlyModelType, NestedRoundTripSharedModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("InputModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        [TestCaseSource(nameof(OutputCase))]
        public void OutpuModel(string expectedModelCodes, string expectedSerializationCodes)
        {
            // refer to the original CADL file: https://github.com/Azure/cadl-ranch/blob/7435655e82b732b3573379f76e0e613423d244e9/packages/cadl-ranch-specs/http/models/nested-models/main.cadl#L51-L58
            var model = new InputModelType("OutputModel", "NestedModelsBasic.Models", "public", null, "Output model with nested model properties", InputModelTypeUsage.Output,
                new List<InputModelProperty>
                {
                    new InputModelProperty("NestedOutputModel", "NestedOutputModel", "Required nested output model.", NestedOutputOnlyModelType, true, false, false),
                    NestedRoundTripSharedModelProperty
                },
                null, new List<InputModelType>(), null, null, null, false);

            var library = new DpgOutputLibraryBuilder(new InputNamespace("NestedModelsBasic.Models", null, new List<string>(),
                new List<InputEnumType>(), new List<InputModelType> { model, NestedOutputOnlyModelType, NestedRoundTripSharedModelType }, new List<InputClient>(), new InputAuth()), default).Build(true);

            ValidateGeneratedCodes("OutputModel", expectedModelCodes, expectedSerializationCodes, library);
        }

        private static readonly InputModelType NestedInputOnlyModelType = new InputModelType("NestedInputOnlyModel", "NestedInputOnlyModel", "public", null, "Model to illustrate a nested model that only appears on an input model.", InputModelTypeUsage.Input,
            new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty, RequiredStringListProperty, RequiredIntListProperty },
            null, new List<InputModelType>(), null, null, null, false);

        private static readonly InputModelType NestedOutputOnlyModelType = new InputModelType("NestedOutputOnlyModel", "NestedOutputOnlyModel", "public", null, "Model to illustrate a nested model that only appears on an ouput model.", InputModelTypeUsage.Output,
            new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty, RequiredStringListProperty, RequiredIntListProperty },
            null, new List<InputModelType>(), null, null, null, false);

        private static readonly InputModelType NestedRoundTripOnlyModelType = new InputModelType("NestedRoundTripOnlyModel", "NestedRoundTripOnlyModel", "public", null, "Model to illustrate a nested model that only appears on a nested model.", InputModelTypeUsage.RoundTrip,
            new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty, RequiredStringListProperty, RequiredIntListProperty },
            null, new List<InputModelType>(), null, null, null, false);

        private static readonly InputModelType NestedRoundTripSharedModelType = new InputModelType("NestedRoundTripSharedModel", "NestedRoundTripSharedModel", "public", null, "Model to illustrate a nested model that appears as a nested model on input, output, and round-trip models.", InputModelTypeUsage.RoundTrip,
            new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty, RequiredStringListProperty, RequiredIntListProperty },
            null, new List<InputModelType>(), null, null, null, false);

        private static readonly InputModelProperty NestedRoundTripSharedModelProperty = new InputModelProperty("NestedSharedModel", "NestedSharedModel", "Required nested shared model.", NestedRoundTripSharedModelType, true, false, false);

        // below are test cases
        private static readonly object[] RoundTripCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using Azure.Core;
using NestedRoundTripOnlyModel;
using NestedRoundTripSharedModel;

namespace NestedModelsBasic.Models
{
/// <summary> Round-trip model with nested model properties. </summary>
public partial class RoundTripModel
{
/// <summary> Initializes a new instance of RoundTripModel. </summary>
/// <param name=""nestedRoundTripModel""> Required nested round-trip model. </param>
/// <param name=""nestedSharedModel""> Required nested shared model. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""nestedRoundTripModel""/> or <paramref name=""nestedSharedModel""/> is null. </exception>
public RoundTripModel(global::NestedRoundTripOnlyModel.NestedRoundTripOnlyModel nestedRoundTripModel,global::NestedRoundTripSharedModel.NestedRoundTripSharedModel nestedSharedModel)
{
global::Azure.Core.Argument.AssertNotNull(nestedRoundTripModel, nameof(nestedRoundTripModel));
global::Azure.Core.Argument.AssertNotNull(nestedSharedModel, nameof(nestedSharedModel));

NestedRoundTripModel = nestedRoundTripModel;
NestedSharedModel = nestedSharedModel;
}

/// <summary> Required nested round-trip model. </summary>
public global::NestedRoundTripOnlyModel.NestedRoundTripOnlyModel NestedRoundTripModel{ get; set; }

/// <summary> Required nested shared model. </summary>
public global::NestedRoundTripSharedModel.NestedRoundTripSharedModel NestedSharedModel{ get; set; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Text.Json;
using Azure;
using Azure.Core;
using NestedRoundTripOnlyModel;
using NestedRoundTripSharedModel;

namespace NestedModelsBasic.Models
{
public partial class RoundTripModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""NestedRoundTripModel"");
writer.WriteObjectValue(NestedRoundTripModel);
writer.WritePropertyName(""NestedSharedModel"");
writer.WriteObjectValue(NestedSharedModel);
writer.WriteEndObject();
}

internal static global::NestedModelsBasic.Models.RoundTripModel DeserializeRoundTripModel(global::System.Text.Json.JsonElement element)
{
global::NestedRoundTripOnlyModel.NestedRoundTripOnlyModel nestedRoundTripModel = default;
global::NestedRoundTripSharedModel.NestedRoundTripSharedModel nestedSharedModel = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""NestedRoundTripModel"")){
nestedRoundTripModel = global::NestedRoundTripOnlyModel.NestedRoundTripOnlyModel.DeserializeNestedRoundTripOnlyModel(property.Value);
continue;
}
if(property.NameEquals(""NestedSharedModel"")){
nestedSharedModel = global::NestedRoundTripSharedModel.NestedRoundTripSharedModel.DeserializeNestedRoundTripSharedModel(property.Value);
continue;
}
}
return new global::NestedModelsBasic.Models.RoundTripModel(nestedRoundTripModel, nestedSharedModel);}

internal global::Azure.Core.RequestContent ToRequestContent()
{
var content = new global::Azure.Core.Utf8JsonRequestContent();
content.JsonWriter.WriteObjectValue(this);
return content;
}

internal static global::NestedModelsBasic.Models.RoundTripModel FromResponse(global::Azure.Response response)
{
using var document = global::System.Text.Json.JsonDocument.Parse(response.Content);
return DeserializeRoundTripModel(document.RootElement);
}
}
}
"
            }
        };

        private static readonly object[] InputCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using Azure.Core;
using NestedInputOnlyModel;
using NestedRoundTripSharedModel;

namespace NestedModelsBasic.Models
{
/// <summary> Input model with nested model properties. </summary>
public partial class InputModel
{
/// <summary> Initializes a new instance of InputModel. </summary>
/// <param name=""nestedInputModel""> Required nested input model. </param>
/// <param name=""nestedSharedModel""> Required nested shared model. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""nestedInputModel""/> or <paramref name=""nestedSharedModel""/> is null. </exception>
public InputModel(global::NestedInputOnlyModel.NestedInputOnlyModel nestedInputModel,global::NestedRoundTripSharedModel.NestedRoundTripSharedModel nestedSharedModel)
{
global::Azure.Core.Argument.AssertNotNull(nestedInputModel, nameof(nestedInputModel));
global::Azure.Core.Argument.AssertNotNull(nestedSharedModel, nameof(nestedSharedModel));

NestedInputModel = nestedInputModel;
NestedSharedModel = nestedSharedModel;
}

/// <summary> Required nested input model. </summary>
public global::NestedInputOnlyModel.NestedInputOnlyModel NestedInputModel{ get; }

/// <summary> Required nested shared model. </summary>
public global::NestedRoundTripSharedModel.NestedRoundTripSharedModel NestedSharedModel{ get; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Text.Json;
using Azure.Core;

namespace NestedModelsBasic.Models
{
public partial class InputModel: global::Azure.Core.IUtf8JsonSerializable
{
void global::Azure.Core.IUtf8JsonSerializable.Write(global::System.Text.Json.Utf8JsonWriter writer)
{
writer.WriteStartObject();
writer.WritePropertyName(""NestedInputModel"");
writer.WriteObjectValue(NestedInputModel);
writer.WritePropertyName(""NestedSharedModel"");
writer.WriteObjectValue(NestedSharedModel);
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

        private static readonly object[] OutputCase =
        {
            new[]
            {
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using Azure.Core;
using NestedOutputOnlyModel;
using NestedRoundTripSharedModel;

namespace NestedModelsBasic.Models
{
/// <summary> Output model with nested model properties. </summary>
public partial class OutputModel
{
/// <summary> Initializes a new instance of OutputModel. </summary>
/// <param name=""nestedOutputModel""> Required nested output model. </param>
/// <param name=""nestedSharedModel""> Required nested shared model. </param>
/// <exception cref=""global::System.ArgumentNullException""> <paramref name=""nestedOutputModel""/> or <paramref name=""nestedSharedModel""/> is null. </exception>
internal OutputModel(global::NestedOutputOnlyModel.NestedOutputOnlyModel nestedOutputModel,global::NestedRoundTripSharedModel.NestedRoundTripSharedModel nestedSharedModel)
{
global::Azure.Core.Argument.AssertNotNull(nestedOutputModel, nameof(nestedOutputModel));
global::Azure.Core.Argument.AssertNotNull(nestedSharedModel, nameof(nestedSharedModel));

NestedOutputModel = nestedOutputModel;
NestedSharedModel = nestedSharedModel;
}

/// <summary> Required nested output model. </summary>
public global::NestedOutputOnlyModel.NestedOutputOnlyModel NestedOutputModel{ get; }

/// <summary> Required nested shared model. </summary>
public global::NestedRoundTripSharedModel.NestedRoundTripSharedModel NestedSharedModel{ get; }
}
}
",
                @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.Text.Json;
using Azure;
using Azure.Core;
using NestedOutputOnlyModel;
using NestedRoundTripSharedModel;

namespace NestedModelsBasic.Models
{
public partial class OutputModel
{
internal static global::NestedModelsBasic.Models.OutputModel DeserializeOutputModel(global::System.Text.Json.JsonElement element)
{
global::NestedOutputOnlyModel.NestedOutputOnlyModel nestedOutputModel = default;
global::NestedRoundTripSharedModel.NestedRoundTripSharedModel nestedSharedModel = default;
foreach (var property in element.EnumerateObject())
{
if(property.NameEquals(""NestedOutputModel"")){
nestedOutputModel = global::NestedOutputOnlyModel.NestedOutputOnlyModel.DeserializeNestedOutputOnlyModel(property.Value);
continue;
}
if(property.NameEquals(""NestedSharedModel"")){
nestedSharedModel = global::NestedRoundTripSharedModel.NestedRoundTripSharedModel.DeserializeNestedRoundTripSharedModel(property.Value);
continue;
}
}
return new global::NestedModelsBasic.Models.OutputModel(nestedOutputModel, nestedSharedModel);}

internal static global::NestedModelsBasic.Models.OutputModel FromResponse(global::Azure.Response response)
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
