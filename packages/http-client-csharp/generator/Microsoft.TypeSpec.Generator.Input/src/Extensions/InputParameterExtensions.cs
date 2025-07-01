// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    /// <summary>
    /// Provides extension methods for <see cref="InputParameter"/> objects.
    /// </summary>
    public static class InputParameterExtensions
    {
        /// <summary>
        /// Determines whether the parameter represents an Accept header.
        /// </summary>
        /// <param name="parameter">The input parameter to check.</param>
        /// <returns><see langword="true"/> if the parameter is an Accept header; otherwise, <see langword="false"/>.</returns>
        public static bool IsAcceptHeader(this InputParameter parameter)
        {
            return parameter.Location == InputRequestLocation.Header && parameter.NameInRequest.Equals("Accept", StringComparison.OrdinalIgnoreCase);
        }
    }
}
