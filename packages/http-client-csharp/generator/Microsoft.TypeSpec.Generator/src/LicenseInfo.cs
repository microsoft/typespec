// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator
{
    public class LicenseInfo
    {
        public string Name { get; }
        public string Company { get; }
        public string Link { get; }
        public string Header { get; }
        public string Description { get; }

        public LicenseInfo(string name, string company, string link, string header, string description)
        {
            Name = name;
            Company = company;
            Link = link;
            Header = header;
            Description = description;
        }
    }
}
