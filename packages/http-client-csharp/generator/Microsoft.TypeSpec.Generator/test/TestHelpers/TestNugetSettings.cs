// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using NuGet.Configuration;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    internal class TestNugetSettings : ISettings
    {
        private readonly List<string> _configFilePaths;

        private Dictionary<string, SettingSection> _sections = new Dictionary<string, SettingSection>();

        public TestNugetSettings(IEnumerable<string>? configFilePaths = default)
        {
            _configFilePaths = configFilePaths?.ToList() ?? [];
        }
#pragma warning disable CS0067 // Unused event
        public event EventHandler? SettingsChanged;
#pragma warning restore CS0067 // Unused event

        public IEnumerable<SettingSection> Sections
        {
            get => _sections.Select(i => i.Value);
            set => _sections = value.ToDictionary(i => i.ElementName, i => i);
        }

        public void AddOrUpdate(string sectionName, SettingItem item)
        {
            throw new NotImplementedException();
        }

        public IList<string> GetConfigFilePaths()
        {
            return _configFilePaths;
        }

        public IList<string> GetConfigRoots()
        {
            throw new NotImplementedException();
        }

        public SettingSection GetSection(string sectionName)
        {
#pragma warning disable CS8603 // Possible null reference return.
            return _sections.TryGetValue(sectionName, out var section) ? section : null;
#pragma warning restore CS8603 // Possible null reference return.
        }

        public void Remove(string sectionName, SettingItem item)
        {
            throw new NotImplementedException();
        }

        public void SaveToDisk()
        {
            throw new NotImplementedException();
        }
    }
}
