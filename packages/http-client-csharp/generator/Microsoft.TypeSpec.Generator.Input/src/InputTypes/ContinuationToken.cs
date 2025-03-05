// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class ContinuationToken
    {
        public InputParameter Parameter { get; }
        public IReadOnlyList<string> ResponseSegments { get; }
        public ResponseLocation ResponseLocation { get; }

        public ContinuationToken(InputParameter parameter, IReadOnlyList<string> responseSegments, ResponseLocation responseLocation)
        {
            Parameter = parameter;
            ResponseSegments = responseSegments;
            ResponseLocation = responseLocation;
        }
    }
}
