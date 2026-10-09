using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public StatusEnum? Status { get; set; }
        public StatusEnum? OptionalStatus { get; set; }
        public IReadOnlyList<StatusEnum> Statuses { get; }
        public IReadOnlyDictionary<string, StatusEnum> StatusMap { get; }
    }

    public enum StatusEnum
    {
        Active,
        Inactive
    }
}
