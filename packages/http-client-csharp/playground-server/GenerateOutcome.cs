// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace PlaygroundServer;

/// <summary>
/// Terminal outcome of a /generate request, recorded on the "outcome" telemetry dimension.
/// </summary>
public enum GenerateOutcome
{
    InvalidContentType,
    InvalidJson,
    MissingFields,
    GeneratorMissing,
    Timeout,
    GeneratorFailed,
    Success,
    Exception,
}

public static class GenerateOutcomeExtensions
{
    /// <summary>
    /// Maps an outcome to its stable telemetry string. These values are part of the telemetry
    /// contract (queried in dashboards), so they must not change when the enum is refactored.
    /// </summary>
    public static string ToTelemetryValue(this GenerateOutcome outcome) => outcome switch
    {
        GenerateOutcome.InvalidContentType => "invalid_content_type",
        GenerateOutcome.InvalidJson => "invalid_json",
        GenerateOutcome.MissingFields => "missing_fields",
        GenerateOutcome.GeneratorMissing => "generator_missing",
        GenerateOutcome.Timeout => "timeout",
        GenerateOutcome.GeneratorFailed => "generator_failed",
        GenerateOutcome.Success => "success",
        GenerateOutcome.Exception => "exception",
        _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, null),
    };
}
