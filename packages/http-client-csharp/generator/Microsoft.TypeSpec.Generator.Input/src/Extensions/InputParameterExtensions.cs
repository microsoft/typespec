// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    public static class InputParameterExtensions
    {
        public static bool IsAcceptHeader(this InputParameter parameter)
        {
            // Handle service method parameters
            if (parameter is InputMethodParameter methodParameter)
            {
                return methodParameter.Location == InputRequestLocation.Header &&
                       methodParameter.SerializedName.Equals("Accept", StringComparison.OrdinalIgnoreCase);
            }

            return parameter is InputHeaderParameter headerParameter && headerParameter.SerializedName.Equals("Accept", StringComparison.OrdinalIgnoreCase);
        }
    }
}
