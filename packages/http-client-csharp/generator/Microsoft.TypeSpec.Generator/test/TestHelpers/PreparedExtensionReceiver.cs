// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public sealed class PreparedExtensionReceiver
    {
        public string ObserveInstance(int value) => "instance";
    }

    public static class PreparedCompetingExtensionProbe
    {
        public static string AmbiguousCandidate(this int receiver, int value, string expression = "") => "peer";
    }
}
