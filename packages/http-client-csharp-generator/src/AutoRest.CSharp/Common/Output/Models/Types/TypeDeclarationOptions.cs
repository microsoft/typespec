// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class TypeDeclarationOptions
    {
        public TypeDeclarationOptions(string name, string ns, string accessibility, bool isAbstract, bool isUserDefined)
        {
            Name = name;
            Namespace = ns;
            Accessibility = accessibility;
            IsAbstract = isAbstract;
            IsUserDefined = isUserDefined;
        }

        public string Name { get; }
        public string Namespace { get; }
        public string Accessibility { get; }
        public bool IsAbstract { get; }
        public bool IsUserDefined { get; }
        public string FullName => $"{this.Namespace}.{this.Name}";
    }
}
