// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.ClientModel.Providers;
using TypeSpec.Generator.Providers;

namespace TypeSpec.Generator.ClientModel
{
    public static class ClientModelExtensions
    {
        /// <summary>
        /// Determines whether the method provider is a service call.
        /// </summary>
        /// <param name="methodProvider">The method provider instance.</param>
        /// <returns>Whether the method provider is a service call.</returns>
        public static bool IsServiceCall(this MethodProvider methodProvider)
            => methodProvider is ScmMethodProvider { IsServiceCall: true };
    }
}
