public AgentTaxonomyInput(global::Sample.Models.EvaluationTarget target, global::System.Collections.Generic.IEnumerable<global::Sample.Models.RiskCategory> riskCategories) : this()
{
    global::Sample.Argument.AssertNotNull(target, nameof(target));
    global::Sample.Argument.AssertNotNull(riskCategories, nameof(riskCategories));

    Target = target;
    RiskCategories = riskCategories.ToList();
}
