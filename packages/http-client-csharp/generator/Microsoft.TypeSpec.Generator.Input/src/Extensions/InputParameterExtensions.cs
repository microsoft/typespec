// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    public static class InputParameterExtensions
    {
        public static bool IsAcceptHeader(this InputParameter parameter)
        {
            return parameter.Location == InputRequestLocation.Header && parameter.NameInRequest.Equals("Accept", StringComparison.OrdinalIgnoreCase);
        }
    }
}
