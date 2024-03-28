// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal abstract class ReportSection
    {
        private string _name;
        public ReportSection(string name)
        {
            this._name = name;
        }

        public string Name => this._name;
        public abstract void Reset();
        public abstract Dictionary<string, object?> GenerateSection();
    }
}
