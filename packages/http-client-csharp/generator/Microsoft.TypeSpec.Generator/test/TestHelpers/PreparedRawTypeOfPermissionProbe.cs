// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    // Public metadata targets for a separately emitted test assembly. No caller
    // observation, callbacks, generated declarations, or overload ambiguity.
    public static class PreparedRawTypeOfPermissionProbe
    {
        public static string SafeType(Type value) => "type";
        public static string Pair(string left, string right) => left + "|" + right;
    }
}
