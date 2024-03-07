// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using AutoRest.CSharp.Common.Input;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class WirePathWriter
    {
        private CodeWriter _writer;

        public WirePathWriter()
        {
            _writer = new CodeWriter();
        }

        public void Write()
        {
            using (_writer.Namespace(Configuration.Namespace))
            {
                _writer.Line($"[{typeof(AttributeUsageAttribute)}({typeof(AttributeTargets)}.{nameof(AttributeTargets.Property)})]");
                using (_writer.Scope($"internal class WirePathAttribute : {typeof(Attribute)}"))
                {
                    _writer.Line($"private string _wirePath;");
                    _writer.Line();
                    using (_writer.Scope($"public WirePathAttribute(string wirePath)"))
                    {
                        _writer.Line($"_wirePath = wirePath;");
                    }
                    _writer.Line();
                    using (_writer.Scope($"public override string ToString()"))
                    {
                        _writer.Line($"return _wirePath;");
                    }
                }
            }
        }

        public override string ToString()
        {
            return _writer.ToString();
        }
    }
}
