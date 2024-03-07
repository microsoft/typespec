// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using Azure.Core;
using NamespaceForEnums;

[assembly: CodeGenSuppressType("ModelToBeSkipped")]
[assembly: CodeGenSuppressType("EnumToBeSkipped")]
[assembly: CodeGenSuppressType("EnumToBeSkippedExtensions")]

namespace CustomNamespace
{
    [CodeGenModel("Model")]
    [CodeGenSuppress("CustomizedModel", typeof(CustomFruitEnum), typeof(CustomDaysOfWeek))]
    internal partial class CustomizedModel: BaseClassForCustomizedModel
    {
        /// <summary> Day of week. </summary>
        public CustomDaysOfWeek DaysOfWeek { get; }

        [CodeGenMember("ModelProperty")]
        internal int? PropertyRenamedAndTypeChanged { get; set; }

        [CodeGenMember("PropertyToField")]
        private readonly string _field;

        internal static CustomizedModel DeserializeCustomizedModel(JsonElement element, ModelReaderWriterOptions options = null)
        {
            options ??= new ModelReaderWriterOptions("W");

            int? propertyRenamedAndTypeChanged = default;
            CustomFruitEnum fruit = default;
            CustomDaysOfWeek daysOfWeek = default;
            string field = default;
            foreach (var property in element.EnumerateObject())
            {
                if (property.NameEquals("ModelProperty"))
                {
                    if (property.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    propertyRenamedAndTypeChanged = property.Value.GetInt32();
                    continue;
                }
                if (property.NameEquals("Fruit"))
                {
                    fruit = property.Value.GetString().ToCustomFruitEnum();
                    continue;
                }
                if (property.NameEquals("DaysOfWeek"))
                {
                    daysOfWeek = new CustomDaysOfWeek(property.Value.GetString());
                    continue;
                }
                if (property.NameEquals("PropertyToField"))
                {
                    field = property.Value.GetString();
                    continue;
                }
            }
            return new CustomizedModel(propertyRenamedAndTypeChanged, field, fruit, daysOfWeek, new Dictionary<string, BinaryData>());
        }
    }
}
