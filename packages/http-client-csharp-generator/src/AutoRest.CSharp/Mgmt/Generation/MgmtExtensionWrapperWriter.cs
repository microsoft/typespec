// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Output;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal class MgmtExtensionWrapperWriter : MgmtClientBaseWriter
    {
        private MgmtExtensionWrapper This { get; }

        public MgmtExtensionWrapperWriter(MgmtExtensionWrapper extensionWrapper) : base(new CodeWriter(), extensionWrapper)
        {
            This = extensionWrapper;
        }

        protected override void WritePrivateHelpers()
        {
            foreach (var extension in This.Extensions)
            {
                if (extension.IsEmpty)
                    continue;

                _writer.Line();

                _writer.WriteMethod(extension.MockingExtensionFactoryMethod);
            }

            base.WritePrivateHelpers();
        }

        protected internal override void WriteImplementations()
        {
            WritePrivateHelpers();

            foreach (var extension in This.Extensions)
            {
                if (extension.IsEmpty)
                    continue;

                MgmtExtensionWriter.GetWriter(_writer, extension).WriteImplementations();
                _writer.Line();
            }
        }
    }
}
