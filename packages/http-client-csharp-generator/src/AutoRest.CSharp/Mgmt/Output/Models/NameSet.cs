// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.Mgmt.Output.Models;

internal readonly struct NameSet
{
    public string DiagnosticField { get; }
    public string DiagnosticProperty { get; }
    public string RestField { get; }
    public string RestProperty { get; }
    public string ApiVersionVariable { get; }

    public NameSet(string diagField, string diagProperty, string restField, string restProperty, string apiVariable)
    {
        DiagnosticField = diagField;
        DiagnosticProperty = diagProperty;
        RestField = restField;
        RestProperty = restProperty;
        ApiVersionVariable = apiVariable;
    }
}
