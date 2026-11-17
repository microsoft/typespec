using System.Collections.Generic;

namespace Sample.Models
{
    public enum RiskCategory { Safety }

    public class EvaluationTarget { }

    public class EvaluationTaxonomyInput { }

    public partial class AgentTaxonomyInput : EvaluationTaxonomyInput
    {
        public AgentTaxonomyInput(EvaluationTarget target, IEnumerable<RiskCategory> riskCategories) { }

        public EvaluationTarget Target { get; set; }
        public IList<RiskCategory> RiskCategories { get; }
    }
}
