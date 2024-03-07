// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Azure.Core;
using NamespaceForEnums;

namespace TypeSchemaMapping.Models
{
    // This model would map without the attribute because the name and namespace is the same.
    internal partial class SecondModel
    {
        // The property maps just using the same name and the generator uses a new type
        /// <summary> . </summary>
        public IReadOnlyDictionary<string, string> DictionaryProperty { get; set; }

        // Need CodeGenMember because we are renaming
        [CodeGenMember("StringProperty")]
        public int IntProperty { get; set; }

        /// <summary> Day of week. </summary>
        public CustomDaysOfWeek? DaysOfWeek { get; set; }
    }
}
