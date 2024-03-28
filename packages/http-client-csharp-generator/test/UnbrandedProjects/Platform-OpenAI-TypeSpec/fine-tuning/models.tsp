namespace OpenAI;
using TypeSpec.OpenAPI;

model FineTuningJob {
  /** The object identifier, which can be referenced in the API endpoints. */
  id: string;

  /** The object type, which is always "fine_tuning.job". */
  object: "fine_tuning.job";

  /** The Unix timestamp (in seconds) for when the fine-tuning job was created. */
  @encode("unixTimestamp", int32)
  created_at: utcDateTime;

  /**
   * The Unix timestamp (in seconds) for when the fine-tuning job was finished. The value will be
   * null if the fine-tuning job is still running.
   */
  @encode("unixTimestamp", int32)
  finished_at: utcDateTime | null;

  /** The base model that is being fine-tuned. */
  `model`: string;

  /**
   * The name of the fine-tuned model that is being created. The value will be null if the
   * fine-tuning job is still running.
   */
  fine_tuned_model: string | null;

  /** The organization that owns the fine-tuning job. */
  organization_id: string;

  /**
   * The current status of the fine-tuning job, which can be either `created`, `pending`, `running`,
   * `succeeded`, `failed`, or `cancelled`.
   */
  status:
    | "created"
    | "pending"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled";

  /**
   * The hyperparameters used for the fine-tuning job. See the
   * [fine-tuning guide](/docs/guides/fine-tuning) for more details.
   */
  hyperparameters: {
    /**
     * The number of epochs to train the model for. An epoch refers to one full cycle through the
     * training dataset.
     *
     * "Auto" decides the optimal number of epochs based on the size of the dataset. If setting the
     * number manually, we support any number between 1 and 50 epochs.
     */
    n_epochs?: "auto" | NEpochs = "auto";
  };

  /**
   * The file ID used for training. You can retrieve the training data with the
   * [Files API](/docs/api-reference/files/retrieve-contents).
   */
  training_file: string;

  /**
   * The file ID used for validation. You can retrieve the validation results with the
   * [Files API](/docs/api-reference/files/retrieve-contents).
   */
  validation_file: string | null;

  /**
   * The compiled results file ID(s) for the fine-tuning job. You can retrieve the results with the
   * [Files API](/docs/api-reference/files/retrieve-contents).
   */
  result_files: string[];

  /**
   * The total number of billable tokens processed by this fine tuning job. The value will be null
   * if the fine-tuning job is still running.
   */
  trained_tokens: safeint | null;

  /**
   * For fine-tuning jobs that have `failed`, this will contain more information on the cause of the
   * failure.
   */
  error: {
    /** A human-readable error message. */
    message?: string; // likely should be required, but spec doesn't say so.

    /** A machine-readable error code. */
    code?: string;

    /**
     * The parameter that was invalid, usually `training_file` or `validation_file`. This field
     * will be null if the failure was not parameter-specific.
     */
    param?: string | null;
  } | null;
}

model FineTuningEvent {
  object: string;

  @encode("unixTimestamp", int32)
  created_at: utcDateTime;

  level: string;
  message: string;
  data?: Record<unknown> | null;
  type?: "message" | "metrics"; // "default is "none"?
}

/** The `FineTune` object represents a legacy fine-tune job that has been created through the API. */
#deprecated "deprecated"
model FineTune {
  /** The object identifier, which can be referenced in the API endpoints. */
  id: string;

  /** The object type, which is always "fine-tune". */
  object: "fine-tune";

  /** The Unix timestamp (in seconds) for when the fine-tuning job was created. */
  @encode("unixTimestamp", int32)
  created_at: utcDateTime;

  /** The Unix timestamp (in seconds) for when the fine-tuning job was last updated. */
  @encode("unixTimestamp", int32)
  updated_at: utcDateTime;

  /** The base model that is being fine-tuned. */
  `model`: string;

  /** The name of the fine-tuned model that is being created. */
  fine_tuned_model: string | null;

  /** The organization that owns the fine-tuning job. */
  organization_id: string;

  /**
   * The current status of the fine-tuning job, which can be either `created`, `running`,
   * `succeeded`, `failed`, or `cancelled`.
   */
  status: "created" | "running" | "succeeded" | "failed" | "cancelled";

  /**
   * The hyperparameters used for the fine-tuning job. See the
   * [fine-tuning guide](/docs/guides/legacy-fine-tuning/hyperparameters) for more details.
   */
  hyperparams: {
    /**
     * The number of epochs to train the model for. An epoch refers to one full cycle through the
     * training dataset.
     */
    n_epochs: safeint;

    /**
     * The batch size to use for training. The batch size is the number of training examples used to
     * train a single forward and backward pass.
     */
    batch_size: safeint;

    /** The weight to use for loss on the prompt tokens. */
    prompt_loss_weight: float64;

    /** The learning rate multiplier to use for training. */
    learning_rate_multiplier: float64;

    /** The classification metrics to compute using the validation dataset at the end of every epoch. */
    compute_classification_metrics?: boolean;

    /** The positive class to use for computing classification metrics. */
    classification_positive_class?: string;

    /** The number of classes to use for computing classification metrics. */
    classification_n_classes?: safeint;
  };

  /** The list of files used for training. */
  training_files: OpenAIFile[];

  /** The list of files used for validation. */
  validation_files: OpenAIFile[];

  /** The compiled results files for the fine-tuning job. */
  result_files: OpenAIFile[];

  /** The list of events that have been observed in the lifecycle of the FineTune job. */
  events?: FineTuneEvent[];
}

model FineTuningJobEvent {
  id: string;
  object: string;

  @encode("unixTimestamp", int32)
  created_at: utcDateTime;

  level: "info" | "warn" | "error";
  message: string;
}

model FineTuneEvent {
  object: string;

  @encode("unixTimestamp", int32)
  created_at: utcDateTime;

  level: string;
  message: string;
}

model CreateFineTuningJobRequest {
  /**
   * The ID of an uploaded file that contains training data.
   *
   * See [upload file](/docs/api-reference/files/upload) for how to upload a file.
   *
   * Your dataset must be formatted as a JSONL file. Additionally, you must upload your file with
   * the purpose `fine-tune`.
   *
   * See the [fine-tuning guide](/docs/guides/fine-tuning) for more details.
   */
  training_file: string;

  /**
   * The ID of an uploaded file that contains validation data.
   *
   * If you provide this file, the data is used to generate validation metrics periodically during
   * fine-tuning. These metrics can be viewed in the fine-tuning results file. The same data should
   * not be present in both train and validation files.
   *
   * Your dataset must be formatted as a JSONL file. You must upload your file with the purpose
   * `fine-tune`.
   *
   * See the [fine-tuning guide](/docs/guides/fine-tuning) for more details.
   */
  validation_file?: string | null;

  /**
   * The name of the model to fine-tune. You can select one of the
   * [supported models](/docs/guides/fine-tuning/what-models-can-be-fine-tuned).
   */
  @extension("x-oaiTypeLabel", "string")
  `model`: string | "babbage-002" | "davinci-002" | "gpt-3.5-turbo";

  /** The hyperparameters used for the fine-tuning job. */
  hyperparameters?: {
    /**
     * The number of epochs to train the model for. An epoch refers to one full cycle through the
     * training dataset.
     */
    n_epochs?: "auto" | NEpochs = "auto";
  };

  /**
   * A string of up to 18 characters that will be added to your fine-tuned model name.
   *
   * For example, a `suffix` of "custom-model-name" would produce a model name like
   * `ft:gpt-3.5-turbo:openai:custom-model-name:7p4lURel`.
   */
  suffix?: SuffixString | null = null;
}

@minValue(1)
@maxValue(50)
scalar NEpochs extends safeint;

model ListFineTuningJobEventsResponse {
  object: string;
  data: FineTuningJobEvent[];
}

model CreateFineTuneRequest {
  /**
   * The ID of an uploaded file that contains training data.
   *
   * See [upload file](/docs/api-reference/files/upload) for how to upload a file.
   *
   * Your dataset must be formatted as a JSONL file, where each training example is a JSON object
   * with the keys "prompt" and "completion". Additionally, you must upload your file with the
   * purpose `fine-tune`.
   *
   * See the [fine-tuning guide](/docs/guides/legacy-fine-tuning/creating-training-data) for more
   * details.
   */
  training_file: string;

  /**
   * The ID of an uploaded file that contains validation data.
   *
   * If you provide this file, the data is used to generate validation metrics periodically during
   * fine-tuning. These metrics can be viewed in the
   * [fine-tuning results file](/docs/guides/legacy-fine-tuning/analyzing-your-fine-tuned-model).
   * Your train and validation data should be mutually exclusive.
   *
   * Your dataset must be formatted as a JSONL file, where each validation example is a JSON object
   * with the keys "prompt" and "completion". Additionally, you must upload your file with the
   * purpose `fine-tune`.
   *
   * See the [fine-tuning guide](/docs/guides/legacy-fine-tuning/creating-training-data) for more
   * details.
   */
  validation_file?: string | null;

  /**
   * The name of the base model to fine-tune. You can select one of "ada", "babbage", "curie",
   * "davinci", or a fine-tuned model created after 2022-04-21 and before 2023-08-22. To learn more
   * about these models, see the [Models](/docs/models) documentation.
   */
  @extension("x-oaiTypeLabel", "string")
  `model`?: string | "ada" | "babbage" | "curie" | "davinci" | null;

  /**
   * The number of epochs to train the model for. An epoch refers to one full cycle through the
   * training dataset.
   */
  n_epochs?: safeint | null = 4;

  /**
   * The batch size to use for training. The batch size is the number of training examples used to
   * train a single forward and backward pass.
   *
   * By default, the batch size will be dynamically configured to be ~0.2% of the number of examples
   * in the training set, capped at 256 - in general, we've found that larger batch sizes tend to
   * work better for larger datasets.
   */
  batch_size?: safeint | null = null;

  /**
   * The learning rate multiplier to use for training. The fine-tuning learning rate is the original
   * learning rate used for pretraining multiplied by this value.
   *
   * By default, the learning rate multiplier is the 0.05, 0.1, or 0.2 depending on final
   * `batch_size` (larger learning rates tend to perform better with larger batch sizes). We
   * recommend experimenting with values in the range 0.02 to 0.2 to see what produces the best
   * results.
   */
  learning_rate_multiplier?: float64 | null = null;

  /**
   * The weight to use for loss on the prompt tokens. This controls how much the model tries to
   * learn to generate the prompt (as compared to the completion which always has a weight of 1.0),
   * and can add a stabilizing effect to training when completions are short.
   *
   * If prompts are extremely long (relative to completions), it may make sense to reduce this
   * weight so as to avoid over-prioritizing learning the prompt.
   */
  prompt_loss_rate?: float64 | null = 0.01;

  /**
   * If set, we calculate classification-specific metrics such as accuracy and F-1 score using the
   * validation set at the end of every epoch. These metrics can be viewed in the
   * [results file](/docs/guides/legacy-fine-tuning/analyzing-your-fine-tuned-model).
   *
   * In order to compute classification metrics, you must provide a `validation_file`. Additionally,
   * you must specify `classification_n_classes` for multiclass classification or
   * `classification_positive_class` for binary classification.
   */
  compute_classification_metrics?: boolean | null = false;

  /**
   * The number of classes in a classification task.
   *
   * This parameter is required for multiclass classification.
   */
  classification_n_classes?: safeint | null = null;

  /**
   * The positive class in binary classification.
   *
   * This parameter is needed to generate precision, recall, and F1 metrics when doing binary
   * classification.
   */
  classification_positive_class?: string | null = null;

  /**
   * If this is provided, we calculate F-beta scores at the specified beta values. The F-beta score
   * is a generalization of F-1 score. This is only used for binary classification.
   *
   * With a beta of 1 (i.e. the F-1 score), precision and recall are given the same weight. A larger
   * beta score puts more weight on recall and less on precision. A smaller beta score puts more
   * weight on precision and less on recall.
   */
  classification_betas?: float64[] | null = null;

  /**
   * A string of up to 18 characters that will be added to your fine-tuned model name.
   *
   * For example, a `suffix` of "custom-model-name" would produce a model name like
   * `ada:ft-your-org:custom-model-name-2022-02-15-04-21-04`.
   */
  suffix?: SuffixString | null = null;
}

@minLength(1)
@maxLength(40)
scalar SuffixString extends string;

model ListFineTunesResponse {
  object: string;
  data: FineTune[];
}

model ListFineTuneEventsResponse {
  object: string;
  data: FineTuneEvent[];
}

model ListPaginatedFineTuningJobsResponse {
  object: string;
  data: FineTuningJob[];
  has_more: boolean;
}
