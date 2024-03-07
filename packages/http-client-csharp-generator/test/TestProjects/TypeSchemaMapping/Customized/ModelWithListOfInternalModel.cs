// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace TypeSchemaMapping.Models
{
    public partial class ModelWithListOfInternalModel
    {
        internal IReadOnlyList<InternalModel> InternalListProperty { get; }
    }
}
