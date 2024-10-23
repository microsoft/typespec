// Typed helper to write microsoft policy files https://eng.ms/docs/more/github-inside-microsoft/policies

export type PolicyServiceConfig = {
  id: string;
  name: string;
  description: string;
  resource: "repository";
  disabled: boolean;
  configuration: {
    resourceManagementConfiguration: {
      eventResponderTasks: EventResponderTask[];
    };
  };
};

export type PayloadType = {
  payloadType:
    | "Issues"
    | "Pull_Request"
    | "Issue_Comment"
    | "Pull_Request_Review"
    | "Pull_Request_Review_Comment";
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
export type LabelRemoved = {
  labelRemoved: { label: string };
};

export type HasLabel = {
  hasLabel: { label: string };
};

export type Or = {
  or: Condition[];
};
export type And = {
  and: Condition[];
};
export type Not = {
  not: Condition;
};
export type IncludesModifiedFiles = {
  includesModifiedFiles: { files: string[] };
};
export type FilesMatchPattern = {
  filesMatchPattern: { pattern: string; matchAny: boolean };
};

export type Condition =
  | PayloadType
  | IsAction
  | LabelAdded
  | HasLabel
  | LabelRemoved
  | IncludesModifiedFiles
  | Or
  | And
  | Not
  | "isAssignedToSomeone"
  | "isOpen";

export function payloadType(payloadType: PayloadType["payloadType"]): PayloadType {
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

export function labelRemoved(label: string): LabelRemoved {
  return {
    labelRemoved: { label },
  };
}

/**
 * Exact path to files that should be modified.
 * DOES NOT support glob patterns or paths.
 */
export function includesModifiedFiles(files: string[]): IncludesModifiedFiles {
  return {
    includesModifiedFiles: { files },
  };
}

/**
 * Check if the pattern of files modified match the given regex(s).
 */
export function filesMatchPattern(pattern: string): FilesMatchPattern {
  return {
    filesMatchPattern: { pattern, matchAny: true },
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
export function not(condition: Condition): Not {
  return { not: condition };
}
export function and(conditions: Condition[]): And {
  return { and: conditions };
}

export type EventResponderTask = {
  description?: string;
  if: Condition[];
  then: any;
};
export function eventResponderTask(options: EventResponderTask): EventResponderTask {
  return options;
}
