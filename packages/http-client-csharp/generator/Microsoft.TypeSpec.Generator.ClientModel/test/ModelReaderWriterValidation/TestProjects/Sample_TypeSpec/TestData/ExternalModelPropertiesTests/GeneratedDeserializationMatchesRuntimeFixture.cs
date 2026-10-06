// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

namespace SampleTypeSpec
{
    public partial class ExternalModelProperties
    {
        internal static global::SampleTypeSpec.ExternalModelProperties DeserializeExternalModelProperties(global::System.Text.Json.JsonElement element, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                return null;
            }
            global::ExternalModels.PersistableExternalModel scalar = default;
            global::System.Collections.Generic.IList<global::ExternalModels.PersistableExternalModel> list = default;
            global::System.Collections.Generic.IDictionary<string, global::ExternalModels.PersistableExternalModel> dictionary = default;
            global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::SampleTypeSpec.ChangeTrackingDictionary<string, global::System.BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("scalar"u8))
                {
                    if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                    {
                        scalar = null;
                        continue;
                    }
                    scalar = global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::ExternalModels.PersistableExternalModel>(prop.Value.GetUtf8Bytes(), options, global::Sample.SampleContext.Default);
                    continue;
                }
                if (prop.NameEquals("list"u8))
                {
                    global::System.Collections.Generic.List<global::ExternalModels.PersistableExternalModel> array = new global::System.Collections.Generic.List<global::ExternalModels.PersistableExternalModel>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        if ((item.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                        {
                            array.Add(null);
                        }
                        else
                        {
                            array.Add(global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::ExternalModels.PersistableExternalModel>(item.GetUtf8Bytes(), options, global::Sample.SampleContext.Default));
                        }
                    }
                    list = array;
                    continue;
                }
                if (prop.NameEquals("dictionary"u8))
                {
                    global::System.Collections.Generic.Dictionary<string, global::ExternalModels.PersistableExternalModel> dictionary0 = new global::System.Collections.Generic.Dictionary<string, global::ExternalModels.PersistableExternalModel>();
                    foreach (var prop0 in prop.Value.EnumerateObject())
                    {
                        if ((prop0.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                        {
                            dictionary0.Add(prop0.Name, null);
                        }
                        else
                        {
                            dictionary0.Add(prop0.Name, global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::ExternalModels.PersistableExternalModel>(prop0.Value.GetUtf8Bytes(), options, global::Sample.SampleContext.Default));
                        }
                    }
                    dictionary = dictionary0;
                    continue;
                }
                if ((options.Format != "W"))
                {
                    additionalBinaryDataProperties.Add(prop.Name, prop.Value.GetUtf8Bytes());
                }
            }
            return new global::SampleTypeSpec.ExternalModelProperties(scalar, (list ?? new global::SampleTypeSpec.ChangeTrackingList<global::ExternalModels.PersistableExternalModel>()), (dictionary ?? new global::SampleTypeSpec.ChangeTrackingDictionary<string, global::ExternalModels.PersistableExternalModel>()), additionalBinaryDataProperties);
        }
    }
}
