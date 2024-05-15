// Typed helper to write microsoft policy files https://eng.ms/docs/more/github-inside-microsoft/policies

export type PayloadType = {
  payloadType: "Issues";
};

export type IsAction = {
  isAction: {
    action: // Issues
    | "Opened"
      | "Closed"
      | "Reopened"
      // Issue_Comment
      | "Created"
      | "Edited"
      // Pull_Request
      | "Opened"
      | "Synchronize"
      | "Closed"
      // Pull_Request_Review
      | "Submitted"
      // Pull_Request_Review_Comment
      | "Created"
      | "Edited";
  };
};

export type LabelAdded = {
  labelAdded: { label: string };
};

export type HasLabel = {
  hasLabel: { label: string };
};

export type Or = {
  or: Condition[];
};

export type Condition = PayloadType | IsAction | LabelAdded | HasLabel | Or;

export function payloadType(payloadType: "Issues"): PayloadType {
  return {
    payloadType,
  };
}

export function isAction(action: "Opened" | "Closed" | "Reopened"): IsAction {
  return {
    isAction: {
      action,
    },
  };
}

export function labelAdded(label: string): LabelAdded {
  return {
    labelAdded: { label },
  };
}
export function hasLabel(label: string): HasLabel {
  return {
    hasLabel: { label },
  };
}

export function or(conditions: Condition[]): Or {
  return { or: conditions };
}
