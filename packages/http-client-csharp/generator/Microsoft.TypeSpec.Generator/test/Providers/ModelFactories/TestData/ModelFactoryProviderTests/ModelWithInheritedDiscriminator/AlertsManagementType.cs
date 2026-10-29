// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    internal readonly partial struct AlertsManagementType
    {
        [CodeGenMember("PrometheusInstantQuery")]
        public static AlertsManagementType InstantQuery { get; } = new AlertsManagementType("PrometheusInstantQuery");

        [CodeGenMember("PrometheusRangeQuery")]
        public static AlertsManagementType RangeQuery { get; } = new AlertsManagementType("PrometheusRangeQuery");
    }
}
