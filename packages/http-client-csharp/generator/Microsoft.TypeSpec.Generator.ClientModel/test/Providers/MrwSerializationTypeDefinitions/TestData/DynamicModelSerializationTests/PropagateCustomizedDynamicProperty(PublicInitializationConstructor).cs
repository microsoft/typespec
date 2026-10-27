global::Sample.Argument.AssertNotNull(prop2, nameof(prop2));

Prop2 = prop2;
_patch.SetPropagators(PropagateSet, PropagateGet);
