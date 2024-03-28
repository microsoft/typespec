// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class DictionaryReportSection<T> : ReportSection
    {
        public Func<Dictionary<string, T>> _getInitialDict;
        public Dictionary<string, T> _dict = new Dictionary<string, T>();

        public DictionaryReportSection(string name, Func<Dictionary<string, T>>? getInitialDict = null)
            : base(name)
        {
            this._getInitialDict = getInitialDict ?? (() => new Dictionary<string, T>());
            this._dict = this._getInitialDict();
        }

        public override Dictionary<string, object?> GenerateSection()
        {
            return this._dict.ToDictionary(kv => kv.Key, kv => (object?)kv.Value);
        }

        public override void Reset()
        {
            this._dict = this._getInitialDict();
        }

        public void Add(string key, T item)
        {
            this._dict[key] = item;
        }
    }
}
