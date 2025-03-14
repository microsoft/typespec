// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputContinuationToken
    {
        public InputParameter Parameter { get; }
        public IReadOnlyList<string> ResponseSegments { get; }
        public InputResponseLocation InputResponseLocation { get; }

        public InputContinuationToken(InputParameter parameter, IReadOnlyList<string> responseSegments, InputResponseLocation inputResponseLocation)
        {
            Parameter = parameter;
            ResponseSegments = responseSegments;
            InputResponseLocation = inputResponseLocation;
        }
    }
}
