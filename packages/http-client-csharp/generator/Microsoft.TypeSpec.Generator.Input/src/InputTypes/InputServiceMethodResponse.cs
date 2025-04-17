// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputServiceMethodResponse
    {
        public InputServiceMethodResponse(InputType? type, IReadOnlyList<string>? resultSegments)
        {
            Type = type;
            ResultSegments = resultSegments;
        }

        public InputType? Type { get; internal set; }
        public IReadOnlyList<string>? ResultSegments { get; internal set; }

        internal InputServiceMethodResponse() : this(null, null) { }
    }
}
