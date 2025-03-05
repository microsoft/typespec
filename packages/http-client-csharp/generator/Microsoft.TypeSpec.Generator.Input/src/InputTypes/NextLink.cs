// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class NextLink
    {
        public InputOperation? Operation { get; }
        public IReadOnlyList<string> ResponseSegments { get; }
        public ResponseLocation ResponseLocation { get; }

        public NextLink(InputOperation? operation, IReadOnlyList<string> responseSegments, ResponseLocation responseLocation)
        {
            Operation = operation;
            ResponseSegments = responseSegments;
            ResponseLocation = responseLocation;
        }
    }
}
