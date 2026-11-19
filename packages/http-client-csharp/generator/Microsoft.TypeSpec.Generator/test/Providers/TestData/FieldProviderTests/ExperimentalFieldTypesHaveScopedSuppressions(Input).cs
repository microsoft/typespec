using System;

namespace System.Diagnostics.CodeAnalysis
{
    [AttributeUsage(AttributeTargets.All, Inherited = false)]
    public sealed class ExperimentalAttribute : Attribute
    {
        public ExperimentalAttribute(string diagnosticId) => DiagnosticId = diagnosticId;
        public string DiagnosticId { get; }
    }
}

namespace Polyfilled.External
{
    [System.Diagnostics.CodeAnalysis.Experimental("FIELD003")]
    public class PolyfilledExperimentalFieldType
    {
    }
}
