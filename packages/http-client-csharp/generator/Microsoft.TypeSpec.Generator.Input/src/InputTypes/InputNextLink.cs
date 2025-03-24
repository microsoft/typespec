// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputNextLink
    {
        public InputOperation? Operation { get; }
        public IReadOnlyList<string> ResponseSegments { get; }
        public InputResponseLocation ResponseLocation { get; }

        public InputNextLink(InputOperation? operation, IReadOnlyList<string> responseSegments, InputResponseLocation responseLocation)
        {
            Operation = operation;
            ResponseSegments = responseSegments;
            ResponseLocation = responseLocation;
        }
    }
}
