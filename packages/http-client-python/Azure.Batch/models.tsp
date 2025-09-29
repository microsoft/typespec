import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;
using Azure.Core;
using Azure.Core.Foundations;

namespace Azure.Batch;

@doc("OSType enums")
union OSType {
  string,

  @doc("The Linux operating system.")
  Linux: "linux",

  @doc("The Windows operating system.")
  Windows: "windows",
}

@doc("ImageVerificationType enums")
union ImageVerificationType {
  string,

  @doc("The Image is guaranteed to be compatible with the associated Compute Node agent SKU and all Batch features have been confirmed to work as expected.")
  Verified: "verified",

  @doc("The associated Compute Node agent SKU should have binary compatibility with the Image, but specific functionality has not been verified.")
  Unverified: "unverified",
}

@doc("BatchCertificateState enums")
union BatchCertificateState {
  string,

  @doc("The Certificate is available for use in Pools.")
  Active: "active",

  @doc("The user has requested that the Certificate be deleted, but the delete operation has not yet completed. You may not reference the Certificate when creating or updating Pools.")
  Deleting: "deleting",

  @doc("The user requested that the Certificate be deleted, but there are Pools that still have references to the Certificate, or it is still installed on one or more Nodes. (The latter can occur if the Certificate has been removed from the Pool, but the Compute Node has not yet restarted. Compute Nodes refresh their Certificates only when they restart.) You may use the cancel Certificate delete operation to cancel the delete, or the delete Certificate operation to retry the delete.")
  DeleteFailed: "deletefailed",
}

@doc("BatchCertificateFormat enums")
union BatchCertificateFormat {
  string,

  @doc("The Certificate is a PFX (PKCS#12) formatted Certificate or Certificate chain.")
  Pfx: "pfx",

  @doc("The Certificate is a base64-encoded X.509 Certificate.")
  Cer: "cer",
}

@doc("BatchJobScheduleState enums")
union BatchJobScheduleState {
  string,

  @doc("The Job Schedule is active and will create Jobs as per its schedule.")
  Active: "active",

  @doc("The Job Schedule has terminated, either by reaching its end time or by the user terminating it explicitly.")
  Completed: "completed",

  @doc("The user has disabled the Job Schedule. The scheduler will not initiate any new Jobs will on this schedule, but any existing active Job will continue to run.")
  Disabled: "disabled",

  @doc("The Job Schedule has no more work to do, or has been explicitly terminated by the user, but the termination operation is still in progress. The scheduler will not initiate any new Jobs for this Job Schedule, nor is any existing Job active.")
  Terminating: "terminating",

  @doc("The user has requested that the Job Schedule be deleted, but the delete operation is still in progress. The scheduler will not initiate any new Jobs for this Job Schedule, and will delete any existing Jobs and Tasks under the Job Schedule, including any active Job. The Job Schedule will be deleted when all Jobs and Tasks under the Job Schedule have been deleted.")
  Deleting: "deleting",
}

@doc("The action the Batch service should take when all Tasks in the Job are in the completed state.")
union BatchAllTasksCompleteMode {
  string,

  @doc("Do nothing. The Job remains active unless terminated or disabled by some other means.")
  NoAction: "noaction",

  @doc("Terminate the Job. The Job's terminationReason is set to 'AllTasksComplete'.")
  TerminateJob: "terminatejob",
}

@doc("TaskFailure enums")
union BatchTaskFailureMode {
  string,

  @doc("Do nothing. The Job remains active unless terminated or disabled by some other means.")
  NoAction: "noaction",

  @doc("Terminate the Job. The Job's terminationReason is set to 'AllTasksComplete'.")
  PerformExitOptionsJobAction: "performexitoptionsjobaction",
}

@doc("ContainerWorkingDirectory enums")
union ContainerWorkingDirectory {
  string,

  @doc("Use the standard Batch service Task working directory, which will contain the Task Resource Files populated by Batch.")
  TaskWorkingDirectory: "taskWorkingDirectory",

  @doc("Use the working directory defined in the container Image. Beware that this directory will not contain the Resource Files downloaded by Batch.")
  ContainerImageDefault: "containerImageDefault",
}

@doc("OutputFileUploadCondition enums")
union OutputFileUploadCondition {
  string,

  @doc("Upload the file(s) only after the Task process exits with an exit code of 0.")
  TaskSuccess: "tasksuccess",

  @doc("Upload the file(s) only after the Task process exits with a nonzero exit code.")
  TaskFailure: "taskfailure",

  @doc("Upload the file(s) after the Task process exits, no matter what the exit code was.")
  TaskCompletion: "taskcompletion",
}

@doc("AutoUserScope enums")
union AutoUserScope {
  string,

  @doc("Specifies that the service should create a new user for the Task.")
  Task: "task",

  @doc("Specifies that the Task runs as the common auto user Account which is created on every Compute Node in a Pool.")
  Pool: "pool",
}

@doc("ElevationLevel enums")
union ElevationLevel {
  string,

  @doc("The user is a standard user without elevated access.")
  NonAdmin: "nonadmin",

  @doc("The user is a user with elevated access and operates with full Administrator permissions.")
  Admin: "admin",
}

@doc("BatchPoolLifetimeOption enums")
union BatchPoolLifetimeOption {
  string,

  @doc("The Pool exists for the lifetime of the Job Schedule. The Batch Service creates the Pool when it creates the first Job on the schedule. You may apply this option only to Job Schedules, not to Jobs.")
  JobSchedule: "jobschedule",

  @doc("The Pool exists for the lifetime of the Job to which it is dedicated. The Batch service creates the Pool when it creates the Job. If the 'job' option is applied to a Job Schedule, the Batch service creates a new auto Pool for every Job created on the schedule.")
  Job: "job",
}

@doc("CachingType enums")
union CachingType {
  string,

  @doc("The caching mode for the disk is not enabled.")
  None: "none",

  @doc("The caching mode for the disk is read only.")
  ReadOnly: "readonly",

  @doc("The caching mode for the disk is read and write.")
  ReadWrite: "readwrite",
}

@doc("StorageAccountType enums")
union StorageAccountType {
  string,

  @doc("The data disk should use standard locally redundant storage.")
  StandardLRS: "standard_lrs",

  @doc("The data disk should use premium locally redundant storage.")
  PremiumLRS: "premium_lrs",

  @doc("The data disk / OS disk should use standard SSD locally redundant storage.")
  StandardSSDLRS: "standardssd_lrs",
}

@doc("DiskEncryptionTarget enums")
union DiskEncryptionTarget {
  string,

  @doc("The OS Disk on the compute node is encrypted.")
  OsDisk: "osdisk",

  @doc("The temporary disk on the compute node is encrypted. On Linux this encryption applies to other partitions (such as those on mounted data disks) when encryption occurs at boot time.")
  TemporaryDisk: "temporarydisk",
}

@doc("The paths which will be mounted to container task's container.")
union ContainerHostDataPath {
  string,

  @doc("The path for multi-instances task to shared their files.")
  Shared: "Shared",

  @doc("The path for start task.")
  Startup: "Startup",

  @doc("The path contains all virtual file systems are mounted on this node.")
  VfsMounts: "VfsMounts",

  @doc("The task path.")
  Task: "Task",

  @doc("The job-prep task path.")
  JobPrep: "JobPrep",

  @doc("The applications path.")
  Applications: "Applications",
}

@doc("BatchNodePlacementPolicyType enums")
union BatchNodePlacementPolicyType {
  string,

  @doc("All nodes in the pool will be allocated in the same region.")
  Regional: "regional",

  @doc("Nodes in the pool will be spread across different availability zones with best effort balancing.")
  Zonal: "zonal",
}

@doc("BatchNodeFillType enums")
union BatchNodeFillType {
  string,

  @doc("Tasks should be assigned evenly across all Compute Nodes in the Pool.")
  Spread: "spread",

  @doc("As many Tasks as possible (taskSlotsPerNode) should be assigned to each Compute Node in the Pool before any Tasks are assigned to the next Compute Node in the Pool.")
  Pack: "pack",
}

@doc("DynamicVNetAssignmentScope enums")
union DynamicVNetAssignmentScope {
  string,

  @doc("No dynamic VNet assignment is enabled.")
  None: "none",

  @doc("Dynamic VNet assignment is done per-job.")
  Job: "job",
}

@doc("InboundEndpointProtocol enums")
union InboundEndpointProtocol {
  string,

  @doc("Use TCP for the endpoint.")
  Tcp: "tcp",

  @doc("Use UDP for the endpoint.")
  Udp: "udp",
}

@doc("NetworkSecurityGroupRuleAccess enums")
union NetworkSecurityGroupRuleAccess {
  string,

  @doc("Allow access.")
  Allow: "allow",

  @doc("Deny access.")
  Deny: "deny",
}

@doc("IPAddressProvisioningType enums")
union IpAddressProvisioningType {
  string,

  @doc("A public IP will be created and managed by Batch. There may be multiple public IPs depending on the size of the Pool.")
  BatchManaged: "batchmanaged",

  @doc("Public IPs are provided by the user and will be used to provision the Compute Nodes.")
  UserManaged: "usermanaged",

  @doc("No public IP Address will be created.")
  NoPublicIpAddresses: "nopublicipaddresses",
}

@doc("Specifies the ephemeral disk placement for operating system disk for all compute nodes (VMs) in the pool.  This property can be used by user in the request to choose which location the operating system should be in. e.g., cache disk space for Ephemeral OS disk provisioning. For more information on Ephemeral OS disk size requirements, please refer to Ephemeral OS disk size requirements for Windows VMs at https://learn.microsoft.com/azure/virtual-machines/windows/ephemeral-os-disks#size-requirements and Linux VMs at https://learn.microsoft.com/azure/virtual-machines/linux/ephemeral-os-disks#size-requirements")
union DiffDiskPlacement {
  string,

  @doc("The Ephemeral OS Disk is stored on the VM cache.")
  CacheDisk: "cachedisk",
}

@doc("ContainerType enums")
union ContainerType {
  string,

  @doc("A Docker compatible container technology will be used to launch the containers.")
  DockerCompatible: "dockerCompatible",

  @doc("A CRI based technology will be used to launch the containers.")
  CriCompatible: "criCompatible",
}

@doc("BatchAccessScope enums")
union BatchAccessScope {
  string,

  @doc("Grants access to perform all operations on the Job containing the Task.")
  Job: "job",
}

@doc("BatchCertificateStoreLocation enums")
union BatchCertificateStoreLocation {
  string,

  @doc("Certificates should be installed to the CurrentUser Certificate store.")
  CurrentUser: "currentuser",

  @doc("Certificates should be installed to the LocalMachine Certificate store.")
  LocalMachine: "localmachine",
}

@doc("BatchCertificateVisibility enums")
union BatchCertificateVisibility {
  string,

  @doc("The Certificate should be visible to the user account under which the StartTask is run. Note that if AutoUser Scope is Pool for both the StartTask and a Task, this certificate will be visible to the Task as well.")
  StartTask: "starttask",

  @doc("The Certificate should be visible to the user accounts under which Job Tasks are run.")
  Task: "task",

  @doc("The Certificate should be visible to the user accounts under which users remotely access the Compute Node.")
  RemoteUser: "remoteuser",
}

@doc("LoginMode enums")
union LoginMode {
  string,

  @doc("The LOGON32_LOGON_BATCH Win32 login mode. The batch login mode is recommended for long running parallel processes.")
  Batch: "batch",

  @doc("The LOGON32_LOGON_INTERACTIVE Win32 login mode. UAC is enabled on Windows VirtualMachineConfiguration Pools. If this option is used with an elevated user identity in a Windows VirtualMachineConfiguration Pool, the user session will not be elevated unless the application executed by the Task command line is configured to always require administrative privilege or to always require maximum privilege.")
  Interactive: "interactive",
}

@doc("BatchNodeCommunicationMode enums")
union BatchNodeCommunicationMode {
  string,

  @doc("The node communication mode is automatically set by the Batch service.")
  Default: "default",

  @doc("Nodes using the classic communication mode require inbound TCP communication on ports 29876 and 29877 from the \"BatchNodeManagement.{region}\" service tag and outbound TCP communication on port 443 to the \"Storage.region\" and \"BatchNodeManagement.{region}\" service tags.")
  Classic: "classic",

  @doc("Nodes using the simplified communication mode require outbound TCP communication on port 443 to the \"BatchNodeManagement.{region}\" service tag. No open inbound ports are required.")
  Simplified: "simplified",
}

@doc("BatchJobState enums")
union BatchJobState {
  string,

  @doc("The Job is available to have Tasks scheduled.")
  Active: "active",

  @doc("A user has requested that the Job be disabled, but the disable operation is still in progress (for example, waiting for Tasks to terminate).")
  Disabling: "disabling",

  @doc("A user has disabled the Job. No Tasks are running, and no new Tasks will be scheduled.")
  Disabled: "disabled",

  @doc("A user has requested that the Job be enabled, but the enable operation is still in progress.")
  Enabling: "enabling",

  @doc("The Job is about to complete, either because a Job Manager Task has completed or because the user has terminated the Job, but the terminate operation is still in progress (for example, because Job Release Tasks are running).")
  Terminating: "terminating",

  @doc("All Tasks have terminated, and the system will not accept any more Tasks or any further changes to the Job.")
  Completed: "completed",

  @doc("A user has requested that the Job be deleted, but the delete operation is still in progress (for example, because the system is still terminating running Tasks).")
  Deleting: "deleting",
}

@doc("BatchErrorSourceCategory enums")
union BatchErrorSourceCategory {
  string,

  @doc("The error is due to a user issue, such as misconfiguration.")
  UserError: "usererror",

  @doc("The error is due to an internal server issue.")
  ServerError: "servererror",
}

@doc("DisableBatchJobOption enums")
union DisableBatchJobOption {
  string,

  @doc("Terminate running Tasks and requeue them. The Tasks will run again when the Job is enabled.")
  Requeue: "requeue",

  @doc("Terminate running Tasks. The Tasks will be completed with failureInfo indicating that they were terminated, and will not run again.")
  Terminate: "terminate",

  @doc("Allow currently running Tasks to complete.")
  Wait: "wait",
}

@doc("BatchJobPreparationTaskState enums")
union BatchJobPreparationTaskState {
  string,

  @doc("The Task is currently running (including retrying).")
  Running: "running",

  @doc("The Task has exited with exit code 0, or the Task has exhausted its retry limit, or the Batch service was unable to start the Task due to Task preparation errors (such as resource file download failures).")
  Completed: "completed",
}

@doc("BatchTaskExecutionResult enums")
union BatchTaskExecutionResult {
  string,

  @doc("The Task ran successfully.")
  Success: "success",

  @doc("There was an error during processing of the Task. The failure may have occurred before the Task process was launched, while the Task process was executing, or after the Task process exited.")
  Failure: "failure",
}

@doc("BatchJobReleaseTaskState enums")
union BatchJobReleaseTaskState {
  string,

  @doc("The Task is currently running (including retrying).")
  Running: "running",

  @doc("The Task has exited with exit code 0, or the Task has exhausted its retry limit, or the Batch service was unable to start the Task due to Task preparation errors (such as resource file download failures).")
  Completed: "completed",
}

@doc("BatchPoolState enums")
union BatchPoolState {
  string,

  @doc("The Pool is available to run Tasks subject to the availability of Compute Nodes.")
  Active: "active",

  @doc("The user has requested that the Pool be deleted, but the delete operation has not yet completed.")
  Deleting: "deleting",
}

@doc("AllocationState enums")
union AllocationState {
  string,

  @doc("The Pool is not resizing. There are no changes to the number of Compute Nodes in the Pool in progress. A Pool enters this state when it is created and when no operations are being performed on the Pool to change the number of Compute Nodes.")
  Steady: "steady",

  @doc("The Pool is resizing; that is, Compute Nodes are being added to or removed from the Pool.")
  Resizing: "resizing",

  @doc("The Pool was resizing, but the user has requested that the resize be stopped, but the stop request has not yet been completed.")
  Stopping: "stopping",
}

@doc("BatchPoolIdentityType enums")
union BatchPoolIdentityType {
  string,

  @doc("Batch pool has user assigned identities with it.")
  UserAssigned: "UserAssigned",

  @doc("Batch pool has no identity associated with it. Setting `None` in update pool will remove existing identities.")
  None: "None",
}

@doc("BatchNodeDeallocationOption enums")
union BatchNodeDeallocationOption {
  string,

  @doc("Terminate running Task processes and requeue the Tasks. The Tasks will run again when a Compute Node is available. Remove Compute Nodes as soon as Tasks have been terminated.")
  Requeue: "requeue",

  @doc("Terminate running Tasks. The Tasks will be completed with failureInfo indicating that they were terminated, and will not run again. Remove Compute Nodes as soon as Tasks have been terminated.")
  Terminate: "terminate",

  @doc("Allow currently running Tasks to complete. Schedule no new Tasks while waiting. Remove Compute Nodes when all Tasks have completed.")
  TaskCompletion: "taskcompletion",

  #deprecated "`RetainedData` is being deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead."
  @doc("Deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead. Allow currently running Tasks to complete, then wait for all Task data retention periods to expire. Schedule no new Tasks while waiting. Remove Compute Nodes when all Task retention periods have expired.")
  RetainedData: "retaineddata",
}

@doc("BatchNodeDeallocateOption enums")
union BatchNodeDeallocateOption {
  string,

  @doc("Terminate running Task processes and requeue the Tasks. The Tasks will run again when a Compute Node is available. Deallocate the Compute Node as soon as Tasks have been terminated.")
  Requeue: "requeue",

  @doc("Terminate running Tasks. The Tasks will be completed with failureInfo indicating that they were terminated, and will not run again. Deallocate the Compute Node as soon as Tasks have been terminated.")
  Terminate: "terminate",

  @doc("Allow currently running Tasks to complete. Schedule no new Tasks while waiting. Deallocate the Compute Node when all Tasks have completed.")
  TaskCompletion: "taskcompletion",

  #deprecated "`RetainedData` is being deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead."
  @doc("Deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead. Allow currently running Tasks to complete, then wait for all Task data retention periods to expire. Schedule no new Tasks while waiting. Deallocate the Compute Node when all Task retention periods have expired.")
  RetainedData: "retaineddata",
}

@doc("BatchJobAction enums")
union BatchJobActionKind {
  string,

  @doc("Take no action.")
  None: "none",

  @doc("Disable the Job. This is equivalent to calling the disable Job API, with a disableTasks value of requeue.")
  Disable: "disable",

  @doc("Terminate the Job. The terminationReason in the Job's executionInfo is set to \"TaskFailed\".")
  Terminate: "terminate",
}

@doc("DependencyAction enums")
union DependencyAction {
  string,

  @doc("Satisfy tasks waiting on this task; once all dependencies are satisfied, the task will be scheduled to run.")
  Satisfy: "satisfy",

  @doc("Blocks tasks waiting on this task, preventing them from being scheduled.")
  Block: "block",
}

@doc("BatchTaskState enums")
union BatchTaskState {
  string,

  @doc("The Task is queued and able to run, but is not currently assigned to a Compute Node. A Task enters this state when it is created, when it is enabled after being disabled, or when it is awaiting a retry after a failed run.")
  Active: "active",

  @doc("The Task has been assigned to a Compute Node, but is waiting for a required Job Preparation Task to complete on the Compute Node. If the Job Preparation Task succeeds, the Task will move to running. If the Job Preparation Task fails, the Task will return to active and will be eligible to be assigned to a different Compute Node.")
  Preparing: "preparing",

  @doc("The Task is running on a Compute Node. This includes task-level preparation such as downloading resource files or deploying Packages specified on the Task - it does not necessarily mean that the Task command line has started executing.")
  Running: "running",

  @doc("The Task is no longer eligible to run, usually because the Task has finished successfully, or the Task has finished unsuccessfully and has exhausted its retry limit. A Task is also marked as completed if an error occurred launching the Task, or when the Task has been terminated.")
  Completed: "completed",
}

@doc("BatchTaskAddStatus enums")
union BatchTaskAddStatus {
  string,

  @doc("The Task was added successfully.")
  Success: "success",

  @doc("The Task failed to add due to a client error and should not be retried without modifying the request as appropriate.")
  ClientError: "clienterror",

  @doc("Task failed to add due to a server error and can be retried without modification.")
  ServerError: "servererror",
}

@doc("BatchSubtaskState enums")
union BatchSubtaskState {
  string,

  @doc("The Task has been assigned to a Compute Node, but is waiting for a required Job Preparation Task to complete on the Compute Node. If the Job Preparation Task succeeds, the Task will move to running. If the Job Preparation Task fails, the Task will return to active and will be eligible to be assigned to a different Compute Node.")
  Preparing: "preparing",

  @doc("The Task is running on a Compute Node. This includes task-level preparation such as downloading resource files or deploying Packages specified on the Task - it does not necessarily mean that the Task command line has started executing.")
  Running: "running",

  @doc("The Task is no longer eligible to run, usually because the Task has finished successfully, or the Task has finished unsuccessfully and has exhausted its retry limit. A Task is also marked as completed if an error occurred launching the Task, or when the Task has been terminated.")
  Completed: "completed",
}

@doc("BatchNodeState enums")
union BatchNodeState {
  string,

  @doc("The Compute Node is not currently running a Task.")
  Idle: "idle",

  @doc("The Compute Node is rebooting.")
  Rebooting: "rebooting",

  @doc("The Compute Node is reimaging.")
  Reimaging: "reimaging",

  @doc("The Compute Node is running one or more Tasks (other than a StartTask).")
  Running: "running",

  @doc("The Compute Node cannot be used for Task execution due to errors.")
  Unusable: "unusable",

  @doc("The Batch service has obtained the underlying virtual machine from Azure Compute, but it has not yet started to join the Pool.")
  Creating: "creating",

  @doc("The Batch service is starting on the underlying virtual machine.")
  Starting: "starting",

  @doc("The StartTask has started running on the Compute Node, but waitForSuccess is set and the StartTask has not yet completed.")
  WaitingForStartTask: "waitingforstarttask",

  @doc("The StartTask has failed on the Compute Node (and exhausted all retries), and waitForSuccess is set. The Compute Node is not usable for running Tasks.")
  StartTaskFailed: "starttaskfailed",

  @doc("The Batch service has lost contact with the Compute Node, and does not know its true state.")
  Unknown: "unknown",

  @doc("The Compute Node is leaving the Pool, either because the user explicitly removed it or because the Pool is resizing or autoscaling down.")
  LeavingPool: "leavingpool",

  @doc("The Compute Node is not currently running a Task, and scheduling of new Tasks to the Compute Node is disabled.")
  Offline: "offline",

  @doc("The Spot/Low-priority Compute Node has been preempted. Tasks which were running on the Compute Node when it was preempted will be rescheduled when another Compute Node becomes available.")
  Preempted: "preempted",

  @doc("The Compute Node is undergoing an OS upgrade operation.")
  UpgradingOS: "upgradingos",

  @doc("The Compute Node is deallocated.")
  Deallocated: "deallocated",

  @doc("The Compute Node is deallocating.")
  Deallocating: "deallocating",
}

@doc("UpgradeMode enums")
union UpgradeMode {
  string,

  @doc("TAll virtual machines in the scale set are automatically updated at the same time.")
  Automatic: "automatic",

  @doc("You control the application of updates to virtual machines in the scale set. You do this by using the manualUpgrade action.")
  Manual: "manual",

  @doc("The existing instances in a scale set are brought down in batches to be upgraded. Once the upgraded batch is complete, the instances will begin taking traffic again and the next batch will begin. This continues until all instances brought up-to-date.")
  Rolling: "rolling",
}

@doc("SchedulingState enums")
union SchedulingState {
  string,

  @doc("Tasks can be scheduled on the Compute Node.")
  Enabled: "enabled",

  @doc("No new Tasks will be scheduled on the Compute Node. Tasks already running on the Compute Node may still run to completion. All Compute Nodes start with scheduling enabled.")
  Disabled: "disabled",
}

@doc("BatchStartTaskState enums")
union BatchStartTaskState {
  string,

  @doc("The StartTask is currently running.")
  Running: "running",

  @doc("The StartTask has exited with exit code 0, or the StartTask has failed and the retry limit has reached, or the StartTask process did not run due to Task preparation errors (such as resource file download failures).")
  Completed: "completed",
}

@doc("BatchNodeRebootKind enums")
union BatchNodeRebootKind {
  string,

  @doc("Terminate running Task processes and requeue the Tasks. The Tasks will run again when a Compute Node is available. Restart the Compute Node as soon as Tasks have been terminated.")
  Requeue: "requeue",

  @doc("Terminate running Tasks. The Tasks will be completed with failureInfo indicating that they were terminated, and will not run again. Restart the Compute Node as soon as Tasks have been terminated.")
  Terminate: "terminate",

  @doc("Allow currently running Tasks to complete. Schedule no new Tasks while waiting. Restart the Compute Node when all Tasks have completed.")
  TaskCompletion: "taskcompletion",

  #deprecated "`RetainedData` is being deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead."
  @doc("Deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead. Allow currently running Tasks to complete, then wait for all Task data retention periods to expire. Schedule no new Tasks while waiting. Restart the Compute Node when all Task retention periods have expired.")
  RetainedData: "retaineddata",
}

@doc("BatchNodeReimageOption enums")
union BatchNodeReimageOption {
  string,

  @doc("Terminate running Task processes and requeue the Tasks. The Tasks will run again when a Compute Node is available. Reimage the Compute Node as soon as Tasks have been terminated.")
  Requeue: "requeue",

  @doc("Terminate running Tasks. The Tasks will be completed with failureInfo indicating that they were terminated, and will not run again. Reimage the Compute Node as soon as Tasks have been terminated.")
  Terminate: "terminate",

  @doc("Allow currently running Tasks to complete. Schedule no new Tasks while waiting. Reimage the Compute Node when all Tasks have completed.")
  TaskCompletion: "taskcompletion",

  #deprecated "`RetainedData` is being deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead."
  @doc("Deprecated, we encourage you to upload task data to Azure Storage in your task and use `TaskCompletion` instead. Allow currently running Tasks to complete, then wait for all Task data retention periods to expire. Schedule no new Tasks while waiting. Reimage the Compute Node when all Task retention periods have expired.")
  RetainedData: "retaineddata",
}

@doc("BatchNodeDisableSchedulingOption enums")
union BatchNodeDisableSchedulingOption {
  string,

  @doc("Terminate running Task processes and requeue the Tasks. The Tasks may run again on other Compute Nodes, or when Task scheduling is re-enabled on this Compute Node. Enter offline state as soon as Tasks have been terminated.")
  Requeue: "requeue",

  @doc("Terminate running Tasks. The Tasks will be completed with failureInfo indicating that they were terminated, and will not run again. Enter offline state as soon as Tasks have been terminated.")
  Terminate: "terminate",

  @doc("Allow currently running Tasks to complete. Schedule no new Tasks while waiting. Enter offline state when all Tasks have completed.")
  TaskCompletion: "taskcompletion",
}

@doc("SecurityEncryptionTypes enums")
union SecurityEncryptionTypes {
  string,

  @doc("NonPersistedTPM")
  NonPersistedTPM: "NonPersistedTPM",

  @doc("VMGuestStateOnly")
  VMGuestStateOnly: "VMGuestStateOnly",
}

@doc("Level code.")
union StatusLevelTypes {
  string,

  @doc("Error")
  Error: "Error",

  @doc("Info")
  Info: "Info",

  @doc("Warning")
  Warning: "Warning",
}

@doc("Specifies the SecurityType of the virtual machine. It has to be set to any specified value to enable UefiSettings.")
union SecurityTypes {
  string,

  @doc("Trusted launch protects against advanced and persistent attack techniques.")
  "trustedLaunch",

  @doc("Azure confidential computing offers confidential VMs are for tenants with high security and confidentiality requirements. These VMs provide a strong, hardware-enforced boundary to help meet your security needs. You can use confidential VMs for migrations without making changes to your code, with the platform protecting your VM's state from being read or modified.")
  "confidentialVM",
}

@doc("The result of listing the applications available in an Account.")
model BatchApplicationListResult {
  @doc("The list of applications available in the Account.")
  @pageItems
  value?: BatchApplication[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("Contains information about an application in an Azure Batch Account.")
model BatchApplication {
  @doc("A string that uniquely identifies the application within the Account.")
  id: string;

  @doc("The display name for the application.")
  displayName: string;

  @doc("The list of available versions of the application.")
  versions: string[];
}

@doc("An error response received from the Azure Batch service.")
@error
model BatchError {
  @doc("An identifier for the error. Codes are invariant and are intended to be consumed programmatically.")
  code?: string;

  @doc("A message describing the error, intended to be suitable for display in a user interface.")
  message?: BatchErrorMessage;

  @doc("A collection of key-value pairs containing additional details about the error.")
  values?: BatchErrorDetail[];
}

@doc("An error message received in an Azure Batch error response.")
model BatchErrorMessage {
  @doc("The language code of the error message.")
  lang?: string;

  @doc("The text of the message.")
  value?: string;
}

@doc("An item of additional information included in an Azure Batch error response.")
model BatchErrorDetail {
  @doc("An identifier specifying the meaning of the Value property.")
  key?: string;

  @doc("The additional information included with the error response.")
  value?: string;
}

@doc("The result of a listing the usage metrics for an Account.")
model BatchPoolListUsageMetricsResult {
  @doc("The Pool usage metrics data.")
  @pageItems
  value?: BatchPoolUsageMetrics[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("Usage metrics for a Pool across an aggregation interval.")
model BatchPoolUsageMetrics {
  @doc("The ID of the Pool whose metrics are aggregated in this entry.")
  poolId: string;

  @doc("The start time of the aggregation interval covered by this entry.")
  startTime: utcDateTime;

  @doc("The end time of the aggregation interval covered by this entry.")
  endTime: utcDateTime;

  @doc("The size of virtual machines in the Pool. All VMs in a Pool are the same size. For information about available sizes of virtual machines in Pools, see Choose a VM size for Compute Nodes in an Azure Batch Pool (https://learn.microsoft.com/azure/batch/batch-pool-vm-sizes).")
  vmSize: string;

  @doc("The total core hours used in the Pool during this aggregation interval.")
  totalCoreHours: float32;
}

@doc("The result of listing the supported Virtual Machine Images.")
model BatchAccountListSupportedImagesResult {
  @doc("The list of supported Virtual Machine Images.")
  @pageItems
  value?: BatchSupportedImage[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("""
  A reference to the Azure Virtual Machines Marketplace Image and additional
  information about the Image.
  """)
model BatchSupportedImage {
  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The ID of the Compute Node agent SKU which the Image supports.")
  @clientName("nodeAgentSkuId")
  nodeAgentSKUId: string;

  @doc("The reference to the Azure Virtual Machine's Marketplace Image.")
  imageReference: BatchVmImageReference;

  @doc("The type of operating system (e.g. Windows or Linux) of the Image.")
  osType: OSType;

  @doc("The capabilities or features which the Image supports. Not every capability of the Image is listed. Capabilities in this list are considered of special interest and are generally related to integration with other features in the Azure Batch service.")
  capabilities?: string[];

  @doc("The time when the Azure Batch service will stop accepting create Pool requests for the Image.")
  batchSupportEndOfLife?: utcDateTime;

  @doc("Whether the Azure Batch service actively verifies that the Image is compatible with the associated Compute Node agent SKU.")
  verificationType: ImageVerificationType;
}

@doc("""
  A reference to an Azure Virtual Machines Marketplace Image or a Azure Compute Gallery Image.
  To get the list of all Azure Marketplace Image references verified by Azure Batch, see the
  ' List Supported Images ' operation.
  """)
model BatchVmImageReference {
  @doc("The publisher of the Azure Virtual Machines Marketplace Image. For example, Canonical or MicrosoftWindowsServer.")
  publisher?: string;

  @doc("The offer type of the Azure Virtual Machines Marketplace Image. For example, UbuntuServer or WindowsServer.")
  offer?: string;

  @doc("The SKU of the Azure Virtual Machines Marketplace Image. For example, 18.04-LTS or 2019-Datacenter.")
  sku?: string;

  @doc("The version of the Azure Virtual Machines Marketplace Image. A value of 'latest' can be specified to select the latest version of an Image. If omitted, the default is 'latest'.")
  version?: string;

  @doc("The ARM resource identifier of the Azure Compute Gallery Image. Compute Nodes in the Pool will be created using this Image Id. This is of the form /subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Compute/galleries/{galleryName}/images/{imageDefinitionName}/versions/{VersionId} or /subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Compute/galleries/{galleryName}/images/{imageDefinitionName} for always defaulting to the latest image version. This property is mutually exclusive with other ImageReference properties. The Azure Compute Gallery Image must have replicas in the same region and must be in the same subscription as the Azure Batch account. If the image version is not specified in the imageId, the latest version will be used. For information about the firewall settings for the Batch Compute Node agent to communicate with the Batch service see https://learn.microsoft.com/azure/batch/nodes-and-pools#virtual-network-vnet-and-firewall-configuration.")
  virtualMachineImageId?: Azure.Core.armResourceIdentifier;

  @doc("The specific version of the platform image or marketplace image used to create the node. This read-only field differs from 'version' only if the value specified for 'version' when the pool was created was 'latest'.")
  @visibility(Lifecycle.Read)
  exactVersion?: string;

  @doc("The shared gallery image unique identifier. This property is mutually exclusive with other properties and can be fetched from shared gallery image GET call.")
  sharedGalleryImageId?: string;

  @doc("The community gallery image unique identifier. This property is mutually exclusive with other properties and can be fetched from community gallery image GET call.")
  communityGalleryImageId?: string;
}

@doc("The result of listing the Compute Node counts in the Account.")
model BatchPoolNodeCountsListResult {
  @doc("A list of Compute Node counts by Pool.")
  @pageItems
  value?: BatchPoolNodeCounts[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("The number of Compute Nodes in each state for a Pool.")
model BatchPoolNodeCounts {
  @doc("The ID of the Pool.")
  poolId: string;

  @doc("The number of dedicated Compute Nodes in each state.")
  dedicated?: BatchNodeCounts;

  @doc("The number of Spot/Low-priority Compute Nodes in each state.")
  lowPriority?: BatchNodeCounts;
}

@doc("The number of Compute Nodes in each Compute Node state.")
model BatchNodeCounts {
  @doc("The number of Compute Nodes in the creating state.")
  creating: int32;

  @doc("The number of Compute Nodes in the idle state.")
  idle: int32;

  @doc("The number of Compute Nodes in the offline state.")
  offline: int32;

  @doc("The number of Compute Nodes in the preempted state.")
  preempted: int32;

  @doc("The count of Compute Nodes in the rebooting state.")
  rebooting: int32;

  @doc("The number of Compute Nodes in the reimaging state.")
  reimaging: int32;

  @doc("The number of Compute Nodes in the running state.")
  running: int32;

  @doc("The number of Compute Nodes in the starting state.")
  starting: int32;

  @doc("The number of Compute Nodes in the startTaskFailed state.")
  startTaskFailed: int32;

  @doc("The number of Compute Nodes in the leavingPool state.")
  leavingPool: int32;

  @doc("The number of Compute Nodes in the unknown state.")
  `unknown`: int32;

  @doc("The number of Compute Nodes in the unusable state.")
  unusable: int32;

  @doc("The number of Compute Nodes in the waitingForStartTask state.")
  waitingForStartTask: int32;

  @doc("The number of Compute Nodes in the deallocated state.")
  deallocated: int32;

  @doc("The number of Compute Nodes in the deallocating state.")
  deallocating: int32;

  @doc("The total number of Compute Nodes.")
  total: int32;

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The number of Compute Nodes in the upgradingOS state.")
  @clientName("upgradingOs", "!go")
  upgradingOS: int32;
}

@doc("Contains utilization and resource usage statistics for the lifetime of a Pool.")
model BatchPoolStatistics {
  @doc("The URL for the statistics.")
  @clientName("uri", "csharp")
  url: url;

  @doc("The start time of the time range covered by the statistics.")
  startTime: utcDateTime;

  @doc("The time at which the statistics were last updated. All statistics are limited to the range between startTime and lastUpdateTime.")
  lastUpdateTime: utcDateTime;

  @doc("Statistics related to Pool usage, such as the amount of core-time used.")
  @clientName("usageStatistics")
  usageStats?: BatchPoolUsageStatistics;

  @doc("Statistics related to resource consumption by Compute Nodes in the Pool.")
  @clientName("resourceStatistics")
  resourceStats?: BatchPoolResourceStatistics;
}

@doc("Statistics related to Pool usage information.")
model BatchPoolUsageStatistics {
  @doc("The start time of the time range covered by the statistics.")
  startTime: utcDateTime;

  @doc("The time at which the statistics were last updated. All statistics are limited to the range between startTime and lastUpdateTime.")
  lastUpdateTime: utcDateTime;

  @doc("The aggregated wall-clock time of the dedicated Compute Node cores being part of the Pool.")
  dedicatedCoreTime: duration;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("Statistics related to resource consumption by Compute Nodes in a Pool.")
model BatchPoolResourceStatistics {
  @doc("The start time of the time range covered by the statistics.")
  startTime: utcDateTime;

  @doc("The time at which the statistics were last updated. All statistics are limited to the range between startTime and lastUpdateTime.")
  lastUpdateTime: utcDateTime;

  @doc("The average CPU usage across all Compute Nodes in the Pool (percentage per node).")
  @clientName("avgCpuPercentage", "!go")
  avgCPUPercentage: float32;

  @doc("The average memory usage in GiB across all Compute Nodes in the Pool.")
  avgMemoryGiB: float32;

  @doc("The peak memory usage in GiB across all Compute Nodes in the Pool.")
  peakMemoryGiB: float32;

  @doc("The average used disk space in GiB across all Compute Nodes in the Pool.")
  avgDiskGiB: float32;

  @doc("The peak used disk space in GiB across all Compute Nodes in the Pool.")
  peakDiskGiB: float32;

  @doc("The total number of disk read operations across all Compute Nodes in the Pool.")
  @encode(string)
  @clientName("diskReadIops")
  diskReadIOps: int64;

  @doc("The total number of disk write operations across all Compute Nodes in the Pool.")
  @encode(string)
  @clientName("diskWriteIops")
  diskWriteIOps: int64;

  @doc("The total amount of data in GiB of disk reads across all Compute Nodes in the Pool.")
  diskReadGiB: float32;

  @doc("The total amount of data in GiB of disk writes across all Compute Nodes in the Pool.")
  diskWriteGiB: float32;

  @doc("The total amount of data in GiB of network reads across all Compute Nodes in the Pool.")
  networkReadGiB: float32;

  @doc("The total amount of data in GiB of network writes across all Compute Nodes in the Pool.")
  networkWriteGiB: float32;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("Resource usage statistics for a Job.")
model BatchJobStatistics {
  @doc("The URL of the statistics.")
  @clientName("uri", "csharp")
  url: url;

  @doc("The start time of the time range covered by the statistics.")
  startTime: utcDateTime;

  @doc("The time at which the statistics were last updated. All statistics are limited to the range between startTime and lastUpdateTime.")
  lastUpdateTime: utcDateTime;

  @doc("The total user mode CPU time (summed across all cores and all Compute Nodes) consumed by all Tasks in the Job.")
  @clientName("userCpuTime")
  userCPUTime: duration;

  @doc("The total kernel mode CPU time (summed across all cores and all Compute Nodes) consumed by all Tasks in the Job.")
  @clientName("kernelCpuTime")
  kernelCPUTime: duration;

  @doc("The total wall clock time of all Tasks in the Job.  The wall clock time is the elapsed time from when the Task started running on a Compute Node to when it finished (or to the last time the statistics were updated, if the Task had not finished by then). If a Task was retried, this includes the wall clock time of all the Task retries.")
  wallClockTime: duration;

  @doc("The total number of disk read operations made by all Tasks in the Job.")
  @encode(string)
  @clientName("readIops")
  readIOps: int64;

  @doc("The total number of disk write operations made by all Tasks in the Job.")
  @encode(string)
  @clientName("writeIops")
  writeIOps: int64;

  @doc("The total amount of data in GiB read from disk by all Tasks in the Job.")
  @clientName("readIoGiB")
  readIOGiB: float32;

  @doc("The total amount of data in GiB written to disk by all Tasks in the Job.")
  @clientName("writeIoGiB")
  writeIOGiB: float32;

  @doc("The total number of Tasks successfully completed in the Job during the given time range. A Task completes successfully if it returns exit code 0.")
  @encode(string)
  @clientName("succeededTasksCount")
  numSucceededTasks: int64;

  @doc("The total number of Tasks in the Job that failed during the given time range. A Task fails if it exhausts its maximum retry count without returning exit code 0.")
  @encode(string)
  @clientName("failedTasksCount")
  numFailedTasks: int64;

  @doc("The total number of retries on all the Tasks in the Job during the given time range.")
  @encode(string)
  @clientName("taskRetriesCount")
  numTaskRetries: int64;

  @doc("The total wait time of all Tasks in the Job. The wait time for a Task is defined as the elapsed time between the creation of the Task and the start of Task execution. (If the Task is retried due to failures, the wait time is the time to the most recent Task execution.) This value is only reported in the Account lifetime statistics; it is not included in the Job statistics.")
  waitTime: duration;
}

@doc("""
  A Certificate that can be installed on Compute Nodes and can be used to
  authenticate operations on the machine.
  """)
model BatchCertificate {
  @doc("The X.509 thumbprint of the Certificate. This is a sequence of up to 40 hex digits (it may include spaces but these are removed).")
  thumbprint: string;

  @doc("The algorithm used to derive the thumbprint. This must be sha1.")
  thumbprintAlgorithm: string;

  @doc("The URL of the Certificate.")
  @visibility(Lifecycle.Read)
  @clientName("uri", "csharp")
  url?: url;

  @doc("The state of the Certificate.")
  @visibility(Lifecycle.Read)
  state?: BatchCertificateState;

  @doc("The time at which the Certificate entered its current state.")
  @visibility(Lifecycle.Read)
  stateTransitionTime?: utcDateTime;

  @doc("The previous state of the Certificate. This property is not set if the Certificate is in its initial active state.")
  @visibility(Lifecycle.Read)
  previousState?: BatchCertificateState;

  @doc("The time at which the Certificate entered its previous state. This property is not set if the Certificate is in its initial Active state.")
  @visibility(Lifecycle.Read)
  previousStateTransitionTime?: utcDateTime;

  @doc("The public part of the Certificate as a base-64 encoded .cer file.")
  @visibility(Lifecycle.Read)
  publicData?: string;

  @doc("The error that occurred on the last attempt to delete this Certificate. This property is set only if the Certificate is in the DeleteFailed state.")
  @visibility(Lifecycle.Read)
  deleteCertificateError?: BatchCertificateDeleteError;

  @doc("The base64-encoded contents of the Certificate. The maximum size is 10KB.")
  @visibility(Lifecycle.Create)
  data: bytes;

  @doc("The format of the Certificate data.")
  @visibility(Lifecycle.Create)
  certificateFormat?: BatchCertificateFormat;

  @doc("The password to access the Certificate's private key. This must be omitted if the Certificate format is cer.")
  @visibility(Lifecycle.Create)
  password?: string;
}

@doc("An error encountered by the Batch service when deleting a Certificate.")
model BatchCertificateDeleteError {
  @doc("An identifier for the Certificate deletion error. Codes are invariant and are intended to be consumed programmatically.")
  code?: string;

  @doc("A message describing the Certificate deletion error, intended to be suitable for display in a user interface.")
  message?: string;

  @doc("A list of additional error details related to the Certificate deletion error. This list includes details such as the active Pools and Compute Nodes referencing this Certificate. However, if a large number of resources reference the Certificate, the list contains only about the first hundred.")
  values?: NameValuePair[];
}

@doc("Represents a name-value pair.")
model NameValuePair {
  @doc("The name in the name-value pair.")
  name?: string;

  @doc("The value in the name-value pair.")
  value?: string;
}

@doc("The result of listing the Certificates in the Account.")
model BatchCertificateListResult {
  @doc("The list of Certificates.")
  @pageItems
  value?: BatchCertificate[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("""
  The result of listing the files on a Compute Node, or the files associated with
  a Task on a Compute Node.
  """)
model BatchNodeFileListResult {
  @doc("The list of files.")
  @pageItems
  value?: BatchNodeFile[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("Information about a file or directory on a Compute Node.")
model BatchNodeFile {
  @doc("The file path.")
  name?: string;

  @doc("The URL of the file.")
  @clientName("uri", "csharp")
  url?: url;

  @doc("Whether the object represents a directory.")
  isDirectory?: boolean;

  @doc("The file properties.")
  properties?: FileProperties;
}

@doc("The properties of a file on a Compute Node.")
model FileProperties {
  @doc("The file creation time. The creation time is not returned for files on Linux Compute Nodes.")
  creationTime?: utcDateTime;

  @doc("The time at which the file was last modified.")
  lastModified: utcDateTime;

  @doc("The length of the file.")
  @encode(string)
  contentLength: int64;

  @doc("The content type of the file.")
  contentType?: string;

  @doc("The file mode attribute in octal format. The file mode is returned only for files on Linux Compute Nodes.")
  fileMode?: string;
}

@doc("""
  A Job Schedule that allows recurring Jobs by specifying when to run Jobs and a
  specification used to create each Job.
  """)
model BatchJobSchedule {
  @doc("A string that uniquely identifies the schedule within the Account.")
  @visibility(Lifecycle.Read)
  id?: string;

  @doc("The display name for the schedule.")
  @visibility(Lifecycle.Read)
  displayName?: string;

  @doc("The URL of the Job Schedule.")
  @visibility(Lifecycle.Read)
  @clientName("uri", "csharp")
  url?: url;

  @doc("The ETag of the Job Schedule. This is an opaque string. You can use it to detect whether the Job Schedule has changed between requests. In particular, you can be pass the ETag with an Update Job Schedule request to specify that your changes should take effect only if nobody else has modified the schedule in the meantime.")
  @visibility(Lifecycle.Read)
  eTag?: eTag;

  @doc("The last modified time of the Job Schedule. This is the last time at which the schedule level data, such as the Job specification or recurrence information, changed. It does not factor in job-level changes such as new Jobs being created or Jobs changing state.")
  @visibility(Lifecycle.Read)
  lastModified?: utcDateTime;

  @doc("The creation time of the Job Schedule.")
  @visibility(Lifecycle.Read)
  creationTime?: utcDateTime;

  @doc("The current state of the Job Schedule.")
  @visibility(Lifecycle.Read)
  state?: BatchJobScheduleState;

  @doc("The time at which the Job Schedule entered the current state.")
  @visibility(Lifecycle.Read)
  stateTransitionTime?: utcDateTime;

  @doc("The previous state of the Job Schedule. This property is not present if the Job Schedule is in its initial active state.")
  @visibility(Lifecycle.Read)
  previousState?: BatchJobScheduleState;

  @doc("The time at which the Job Schedule entered its previous state. This property is not present if the Job Schedule is in its initial active state.")
  @visibility(Lifecycle.Read)
  previousStateTransitionTime?: utcDateTime;

  @doc("The schedule according to which Jobs will be created. All times are fixed respective to UTC and are not impacted by daylight saving time.")
  schedule?: BatchJobScheduleConfiguration;

  @doc("The details of the Jobs to be created on this schedule.")
  jobSpecification: BatchJobSpecification;

  @doc("Information about Jobs that have been and will be run under this schedule.")
  @visibility(Lifecycle.Read)
  executionInfo?: BatchJobScheduleExecutionInfo;

  @doc("A list of name-value pairs associated with the schedule as metadata. The Batch service does not assign any meaning to metadata; it is solely for the use of user code.")
  metadata?: BatchMetadataItem[];

  @doc("The lifetime resource usage statistics for the Job Schedule. The statistics may not be immediately available. The Batch service performs periodic roll-up of statistics. The typical delay is about 30 minutes.")
  @visibility(Lifecycle.Read)
  @clientName("jobScheduleStatistics")
  stats?: BatchJobScheduleStatistics;
}

@doc("""
  Parameters for updating an Azure Batch Job Schedule.
  """)
model BatchJobScheduleUpdateOptions {
  @doc("The schedule according to which Jobs will be created. All times are fixed respective to UTC and are not impacted by daylight saving time. If you do not specify this element, the existing schedule is left unchanged.")
  schedule?: BatchJobScheduleConfiguration;

  @doc("The details of the Jobs to be created on this schedule. Updates affect only Jobs that are started after the update has taken place. Any currently active Job continues with the older specification.")
  jobSpecification?: BatchJobSpecification;

  @doc("A list of name-value pairs associated with the Job Schedule as metadata. If you do not specify this element, existing metadata is left unchanged.")
  metadata?: BatchMetadataItem[];
}

@doc("""
  Parameters for creating an Azure Batch Job Schedule
  """)
model BatchJobScheduleCreateOptions {
  @doc("A string that uniquely identifies the schedule within the Account. The ID can contain any combination of alphanumeric characters including hyphens and underscores, and cannot contain more than 64 characters. The ID is case-preserving and case-insensitive (that is, you may not have two IDs within an Account that differ only by case).")
  id: string;

  @doc("The display name for the schedule. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  displayName?: string;

  @doc("The schedule according to which Jobs will be created. All times are fixed respective to UTC and are not impacted by daylight saving time.")
  schedule: BatchJobScheduleConfiguration;

  @doc("The details of the Jobs to be created on this schedule.")
  jobSpecification: BatchJobSpecification;

  @doc("A list of name-value pairs associated with the schedule as metadata. The Batch service does not assign any meaning to metadata; it is solely for the use of user code.")
  metadata?: BatchMetadataItem[];
}

@doc("""
  The schedule according to which Jobs will be created. All times are fixed
  respective to UTC and are not impacted by daylight saving time.
  """)
model BatchJobScheduleConfiguration {
  @doc("The earliest time at which any Job may be created under this Job Schedule. If you do not specify a doNotRunUntil time, the schedule becomes ready to create Jobs immediately.")
  doNotRunUntil?: utcDateTime;

  @doc("A time after which no Job will be created under this Job Schedule. The schedule will move to the completed state as soon as this deadline is past and there is no active Job under this Job Schedule. If you do not specify a doNotRunAfter time, and you are creating a recurring Job Schedule, the Job Schedule will remain active until you explicitly terminate it.")
  doNotRunAfter?: utcDateTime;

  @doc("The time interval, starting from the time at which the schedule indicates a Job should be created, within which a Job must be created. If a Job is not created within the startWindow interval, then the 'opportunity' is lost; no Job will be created until the next recurrence of the schedule. If the schedule is recurring, and the startWindow is longer than the recurrence interval, then this is equivalent to an infinite startWindow, because the Job that is 'due' in one recurrenceInterval is not carried forward into the next recurrence interval. The default is infinite. The minimum value is 1 minute. If you specify a lower value, the Batch service rejects the schedule with an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  startWindow?: duration;

  @doc("The time interval between the start times of two successive Jobs under the Job Schedule. A Job Schedule can have at most one active Job under it at any given time. Because a Job Schedule can have at most one active Job under it at any given time, if it is time to create a new Job under a Job Schedule, but the previous Job is still running, the Batch service will not create the new Job until the previous Job finishes. If the previous Job does not finish within the startWindow period of the new recurrenceInterval, then no new Job will be scheduled for that interval. For recurring Jobs, you should normally specify a jobManagerTask in the jobSpecification. If you do not use jobManagerTask, you will need an external process to monitor when Jobs are created, add Tasks to the Jobs and terminate the Jobs ready for the next recurrence. The default is that the schedule does not recur: one Job is created, within the startWindow after the doNotRunUntil time, and the schedule is complete as soon as that Job finishes. The minimum value is 1 minute. If you specify a lower value, the Batch service rejects the schedule with an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  recurrenceInterval?: duration;
}

@doc("Specifies the security profile settings for the virtual machine or virtual machine scale set.")
model SecurityProfile {
  @doc("This property can be used by user in the request to enable or disable the Host Encryption for the virtual machine or virtual machine scale set. This will enable the encryption for all the disks including Resource/Temp disk at host itself. For more information on encryption at host requirements, please refer to https://learn.microsoft.com/azure/virtual-machines/disk-encryption#supported-vm-sizes.")
  encryptionAtHost?: boolean;

  @doc("Specifies the SecurityType of the virtual machine. It has to be set to any specified value to enable UefiSettings.")
  securityType?: SecurityTypes;

  @doc("Specifies the security settings like secure boot and vTPM used while creating the virtual machine. Specifies the security settings like secure boot and vTPM used while creating the virtual machine.")
  uefiSettings?: BatchUefiSettings;
}

@doc("""
  Specifies the service artifact reference id used to set same image version
  for all virtual machines in the scale set when using 'latest' image version.
  """)
model ServiceArtifactReference {
  @doc("The service artifact reference id of ServiceArtifactReference. The service artifact reference id in the form of /subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Compute/galleries/{galleryName}/serviceArtifacts/{serviceArtifactName}/vmArtifactsProfiles/{vmArtifactsProfilesName}")
  id: string;
}

@doc("Specifies details of the Jobs to be created on a schedule.")
model BatchJobSpecification {
  @doc("The priority of Jobs created under this schedule. Priority values can range from -1000 to 1000, with -1000 being the lowest priority and 1000 being the highest priority. The default value is 0. This priority is used as the default for all Jobs under the Job Schedule. You can update a Job's priority after it has been created using by using the update Job API.")
  priority?: int32;

  @doc("Whether Tasks in this job can be preempted by other high priority jobs. If the value is set to True, other high priority jobs submitted to the system will take precedence and will be able requeue tasks from this job. You can update a job's allowTaskPreemption after it has been created using the update job API.")
  allowTaskPreemption?: boolean;

  @doc("The maximum number of tasks that can be executed in parallel for the job. The value of maxParallelTasks must be -1 or greater than 0 if specified. If not specified, the default value is -1, which means there's no limit to the number of tasks that can be run at once. You can update a job's maxParallelTasks after it has been created using the update job API.")
  maxParallelTasks?: int32;

  @doc("The display name for Jobs created under this schedule. The name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  displayName?: string;

  @doc("Whether Tasks in the Job can define dependencies on each other. The default is false.")
  usesTaskDependencies?: boolean;

  @doc("The action the Batch service should take when all Tasks in a Job created under this schedule are in the completed state. Note that if a Job contains no Tasks, then all Tasks are considered complete. This option is therefore most commonly used with a Job Manager task; if you want to use automatic Job termination without a Job Manager, you should initially set onAllTasksComplete to noaction and update the Job properties to set onAllTasksComplete to terminatejob once you have finished adding Tasks. The default is noaction.")
  @clientName("allTasksCompleteMode")
  onAllTasksComplete?: BatchAllTasksCompleteMode;

  @doc("The action the Batch service should take when any Task fails in a Job created under this schedule. A Task is considered to have failed if it have failed if has a failureInfo. A failureInfo is set if the Task completes with a non-zero exit code after exhausting its retry count, or if there was an error starting the Task, for example due to a resource file download error. The default is noaction.")
  @clientName("taskFailureMode")
  onTaskFailure?: BatchTaskFailureMode;

  @doc("The network configuration for the Job.")
  networkConfiguration?: BatchJobNetworkConfiguration;

  @doc("The execution constraints for Jobs created under this schedule.")
  constraints?: BatchJobConstraints;

  @doc("The details of a Job Manager Task to be launched when a Job is started under this schedule. If the Job does not specify a Job Manager Task, the user must explicitly add Tasks to the Job using the Task API. If the Job does specify a Job Manager Task, the Batch service creates the Job Manager Task when the Job is created, and will try to schedule the Job Manager Task before scheduling other Tasks in the Job.")
  jobManagerTask?: BatchJobManagerTask;

  @doc("The Job Preparation Task for Jobs created under this schedule. If a Job has a Job Preparation Task, the Batch service will run the Job Preparation Task on a Node before starting any Tasks of that Job on that Compute Node.")
  jobPreparationTask?: BatchJobPreparationTask;

  @doc("The Job Release Task for Jobs created under this schedule. The primary purpose of the Job Release Task is to undo changes to Nodes made by the Job Preparation Task. Example activities include deleting local files, or shutting down services that were started as part of Job preparation. A Job Release Task cannot be specified without also specifying a Job Preparation Task for the Job. The Batch service runs the Job Release Task on the Compute Nodes that have run the Job Preparation Task.")
  jobReleaseTask?: BatchJobReleaseTask;

  @doc("A list of common environment variable settings. These environment variables are set for all Tasks in Jobs created under this schedule (including the Job Manager, Job Preparation and Job Release Tasks). Individual Tasks can override an environment setting specified here by specifying the same setting name with a different value.")
  commonEnvironmentSettings?: EnvironmentSetting[];

  @doc("The Pool on which the Batch service runs the Tasks of Jobs created under this schedule.")
  poolInfo: BatchPoolInfo;

  @doc("A list of name-value pairs associated with each Job created under this schedule as metadata. The Batch service does not assign any meaning to metadata; it is solely for the use of user code.")
  metadata?: BatchMetadataItem[];
}

@doc("The network configuration for the Job.")
model BatchJobNetworkConfiguration {
  @doc("The ARM resource identifier of the virtual network subnet which Compute Nodes running Tasks from the Job will join for the duration of the Task. The virtual network must be in the same region and subscription as the Azure Batch Account. The specified subnet should have enough free IP addresses to accommodate the number of Compute Nodes which will run Tasks from the Job. This can be up to the number of Compute Nodes in the Pool. The 'MicrosoftAzureBatch' service principal must have the 'Classic Virtual Machine Contributor' Role-Based Access Control (RBAC) role for the specified VNet so that Azure Batch service can schedule Tasks on the Nodes. This can be verified by checking if the specified VNet has any associated Network Security Groups (NSG). If communication to the Nodes in the specified subnet is denied by an NSG, then the Batch service will set the state of the Compute Nodes to unusable. This is of the form /subscriptions/{subscription}/resourceGroups/{group}/providers/{provider}/virtualNetworks/{network}/subnets/{subnet}. If the specified VNet has any associated Network Security Groups (NSG), then a few reserved system ports must be enabled for inbound communication from the Azure Batch service. For Pools created with a Virtual Machine configuration, enable ports 29876 and 29877, as well as port 22 for Linux and port 3389 for Windows. Port 443 is also required to be open for outbound connections for communications to Azure Storage. For more details see: https://learn.microsoft.com/azure/batch/batch-api-basics#virtual-network-vnet-and-firewall-configuration.")
  subnetId: string;

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("Whether to withdraw Compute Nodes from the virtual network to DNC when the job is terminated or deleted.  If true, nodes will remain joined to the virtual network to DNC. If false, nodes will automatically withdraw when the job ends. Defaults to false.")
  @clientName("skipWithdrawFromVnet")
  skipWithdrawFromVNet?: boolean;
}

@doc("The execution constraints for a Job.")
model BatchJobConstraints {
  @doc("The maximum elapsed time that the Job may run, measured from the time the Job is created. If the Job does not complete within the time limit, the Batch service terminates it and any Tasks that are still running. In this case, the termination reason will be MaxWallClockTimeExpiry. If this property is not specified, there is no time limit on how long the Job may run.")
  maxWallClockTime?: duration;

  @doc("The maximum number of times each Task may be retried. The Batch service retries a Task if its exit code is nonzero. Note that this value specifically controls the number of retries. The Batch service will try each Task once, and may then retry up to this limit. For example, if the maximum retry count is 3, Batch tries a Task up to 4 times (one initial try and 3 retries). If the maximum retry count is 0, the Batch service does not retry Tasks. If the maximum retry count is -1, the Batch service retries Tasks without limit. The default value is 0 (no retries).")
  maxTaskRetryCount?: int32;
}

@doc("""
  Specifies details of a Job Manager Task.
  The Job Manager Task is automatically started when the Job is created. The
  Batch service tries to schedule the Job Manager Task before any other Tasks in
  the Job. When shrinking a Pool, the Batch service tries to preserve Nodes where
  Job Manager Tasks are running for as long as possible (that is, Compute Nodes
  running 'normal' Tasks are removed before Compute Nodes running Job Manager
  Tasks). When a Job Manager Task fails and needs to be restarted, the system
  tries to schedule it at the highest priority. If there are no idle Compute
  Nodes available, the system may terminate one of the running Tasks in the Pool
  and return it to the queue in order to make room for the Job Manager Task to
  restart. Note that a Job Manager Task in one Job does not have priority over
  Tasks in other Jobs. Across Jobs, only Job level priorities are observed. For
  example, if a Job Manager in a priority 0 Job needs to be restarted, it will
  not displace Tasks of a priority 1 Job. Batch will retry Tasks when a recovery
  operation is triggered on a Node. Examples of recovery operations include (but
  are not limited to) when an unhealthy Node is rebooted or a Compute Node
  disappeared due to host failure. Retries due to recovery operations are
  independent of and are not counted against the maxTaskRetryCount. Even if the
  maxTaskRetryCount is 0, an internal retry due to a recovery operation may
  occur. Because of this, all Tasks should be idempotent. This means Tasks need
  to tolerate being interrupted and restarted without causing any corruption or
  duplicate data. The best practice for long running Tasks is to use some form of
  checkpointing.
  """)
model BatchJobManagerTask {
  @doc("A string that uniquely identifies the Job Manager Task within the Job. The ID can contain any combination of alphanumeric characters including hyphens and underscores and cannot contain more than 64 characters.")
  id: string;

  @doc("The display name of the Job Manager Task. It need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  displayName?: string;

  @doc("The command line of the Job Manager Task. The command line does not run under a shell, and therefore cannot take advantage of shell features such as environment variable expansion. If you want to take advantage of such features, you should invoke the shell in the command line, for example using \"cmd /c MyCommand\" in Windows or \"/bin/sh -c MyCommand\" in Linux. If the command line refers to file paths, it should use a relative path (relative to the Task working directory), or use the Batch provided environment variable (https://learn.microsoft.com/azure/batch/batch-compute-node-environment-variables).")
  commandLine: string;

  @doc("The settings for the container under which the Job Manager Task runs. If the Pool that will run this Task has containerConfiguration set, this must be set as well. If the Pool that will run this Task doesn't have containerConfiguration set, this must not be set. When this is specified, all directories recursively below the AZ_BATCH_NODE_ROOT_DIR (the root of Azure Batch directories on the node) are mapped into the container, all Task environment variables are mapped into the container, and the Task command line is executed in the container. Files produced in the container outside of AZ_BATCH_NODE_ROOT_DIR might not be reflected to the host disk, meaning that Batch file APIs will not be able to access those files.")
  containerSettings?: BatchTaskContainerSettings;

  @doc("A list of files that the Batch service will download to the Compute Node before running the command line. Files listed under this element are located in the Task's working directory. There is a maximum size for the list of resource files.  When the max size is exceeded, the request will fail and the response error code will be RequestEntityTooLarge. If this occurs, the collection of ResourceFiles must be reduced in size. This can be achieved using .zip files, Application Packages, or Docker Containers.")
  resourceFiles?: ResourceFile[];

  @doc("A list of files that the Batch service will upload from the Compute Node after running the command line. For multi-instance Tasks, the files will only be uploaded from the Compute Node on which the primary Task is executed.")
  outputFiles?: OutputFile[];

  @doc("A list of environment variable settings for the Job Manager Task.")
  environmentSettings?: EnvironmentSetting[];

  @doc("Constraints that apply to the Job Manager Task.")
  constraints?: BatchTaskConstraints;

  @doc("The number of scheduling slots that the Task requires to run. The default is 1. A Task can only be scheduled to run on a compute node if the node has enough free scheduling slots available. For multi-instance Tasks, this property is not supported and must not be specified.")
  requiredSlots?: int32;

  @doc("Whether completion of the Job Manager Task signifies completion of the entire Job. If true, when the Job Manager Task completes, the Batch service marks the Job as complete. If any Tasks are still running at this time (other than Job Release), those Tasks are terminated. If false, the completion of the Job Manager Task does not affect the Job status. In this case, you should either use the onAllTasksComplete attribute to terminate the Job, or have a client or user terminate the Job explicitly. An example of this is if the Job Manager creates a set of Tasks but then takes no further role in their execution. The default value is true. If you are using the onAllTasksComplete and onTaskFailure attributes to control Job lifetime, and using the Job Manager Task only to create the Tasks for the Job (not to monitor progress), then it is important to set killJobOnCompletion to false.")
  killJobOnCompletion?: boolean;

  @doc("The user identity under which the Job Manager Task runs. If omitted, the Task runs as a non-administrative user unique to the Task.")
  userIdentity?: UserIdentity;

  @doc("Whether the Job Manager Task requires exclusive use of the Compute Node where it runs. If true, no other Tasks will run on the same Node for as long as the Job Manager is running. If false, other Tasks can run simultaneously with the Job Manager on a Compute Node. The Job Manager Task counts normally against the Compute Node's concurrent Task limit, so this is only relevant if the Compute Node allows multiple concurrent Tasks. The default value is true.")
  runExclusive?: boolean;

  @doc("""
    A list of Application Packages that the Batch service will deploy to the
    Compute Node before running the command line.Application Packages are
    downloaded and deployed to a shared directory, not the Task working
    directory. Therefore, if a referenced Application Package is already
    on the Compute Node, and is up to date, then it is not re-downloaded;
    the existing copy on the Compute Node is used. If a referenced Application
    Package cannot be installed, for example because the package has been deleted
    or because download failed, the Task fails.
    """)
  applicationPackageReferences?: BatchApplicationPackageReference[];

  @doc("The settings for an authentication token that the Task can use to perform Batch service operations. If this property is set, the Batch service provides the Task with an authentication token which can be used to authenticate Batch service operations without requiring an Account access key. The token is provided via the AZ_BATCH_AUTHENTICATION_TOKEN environment variable. The operations that the Task can carry out using the token depend on the settings. For example, a Task can request Job permissions in order to add other Tasks to the Job, or check the status of the Job or of other Tasks under the Job.")
  authenticationTokenSettings?: AuthenticationTokenSettings;

  @doc("Whether the Job Manager Task may run on a Spot/Low-priority Compute Node. The default value is true.")
  allowLowPriorityNode?: boolean;
}

@doc("The container settings for a Task.")
model BatchTaskContainerSettings {
  @doc("Additional options to the container create command. These additional options are supplied as arguments to the \"docker create\" command, in addition to those controlled by the Batch Service.")
  containerRunOptions?: string;

  @doc("The Image to use to create the container in which the Task will run. This is the full Image reference, as would be specified to \"docker pull\". If no tag is provided as part of the Image name, the tag \":latest\" is used as a default.")
  imageName: string;

  @doc("The private registry which contains the container Image. This setting can be omitted if was already provided at Pool creation.")
  registry?: ContainerRegistryReference;

  @doc("The location of the container Task working directory. The default is 'taskWorkingDirectory'.")
  workingDirectory?: ContainerWorkingDirectory;

  @doc("The paths you want to mounted to container task. If this array is null or be not present, container task will mount entire temporary disk drive in windows (or AZ_BATCH_NODE_ROOT_DIR in Linux). It won't' mount any data paths into container if this array is set as empty.")
  containerHostBatchBindMounts?: ContainerHostBatchBindMountEntry[];
}

@doc("The entry of path and mount mode you want to mount into task container.")
model ContainerHostBatchBindMountEntry {
  @doc("The path which be mounted to container customer can select.")
  source?: ContainerHostDataPath;

  @doc("Mount this source path as read-only mode or not. Default value is false (read/write mode). For Linux, if you mount this path as a read/write mode, this does not mean that all users in container have the read/write access for the path, it depends on the access in host VM. If this path is mounted read-only, all users within the container will not be able to modify the path.")
  isReadOnly?: boolean;
}

@doc("A private container registry.")
model ContainerRegistryReference {
  @doc("The user name to log into the registry server.")
  username?: string;

  @secret
  @doc("The password to log into the registry server.")
  password?: string;

  @doc("The registry URL. If omitted, the default is \"docker.io\".")
  @clientName("registryServerUri", "csharp")
  registryServer?: url;

  @doc("The reference to the user assigned identity to use to access an Azure Container Registry instead of username and password.")
  identityReference?: BatchNodeIdentityReference;
}

@doc("""
  The reference to a user assigned identity associated with the Batch pool which
  a compute node will use.
  """)
model BatchNodeIdentityReference {
  @doc("The ARM resource id of the user assigned identity.")
  resourceId?: Azure.Core.armResourceIdentifier;
}

@doc("A single file or multiple files to be downloaded to a Compute Node.")
model ResourceFile {
  @doc("The storage container name in the auto storage Account. The autoStorageContainerName, storageContainerUrl and httpUrl properties are mutually exclusive and one of them must be specified.")
  autoStorageContainerName?: string;

  @doc("The URL of the blob container within Azure Blob Storage. The autoStorageContainerName, storageContainerUrl and httpUrl properties are mutually exclusive and one of them must be specified. This URL must be readable and listable from compute nodes. There are three ways to get such a URL for a container in Azure storage: include a Shared Access Signature (SAS) granting read and list permissions on the container, use a managed identity with read and list permissions, or set the ACL for the container to allow public access.")
  @clientName("storageContainerUri", "csharp")
  storageContainerUrl?: url;

  @doc("The URL of the file to download. The autoStorageContainerName, storageContainerUrl and httpUrl properties are mutually exclusive and one of them must be specified. If the URL points to Azure Blob Storage, it must be readable from compute nodes. There are three ways to get such a URL for a blob in Azure storage: include a Shared Access Signature (SAS) granting read permissions on the blob, use a managed identity with read permission, or set the ACL for the blob or its container to allow public access.")
  @clientName("httpUri", "csharp")
  httpUrl?: url;

  @doc("The blob prefix to use when downloading blobs from an Azure Storage container. Only the blobs whose names begin with the specified prefix will be downloaded. The property is valid only when autoStorageContainerName or storageContainerUrl is used. This prefix can be a partial filename or a subdirectory. If a prefix is not specified, all the files in the container will be downloaded.")
  blobPrefix?: string;

  @doc("The location on the Compute Node to which to download the file(s), relative to the Task's working directory. If the httpUrl property is specified, the filePath is required and describes the path which the file will be downloaded to, including the filename. Otherwise, if the autoStorageContainerName or storageContainerUrl property is specified, filePath is optional and is the directory to download the files to. In the case where filePath is used as a directory, any directory structure already associated with the input data will be retained in full and appended to the specified filePath directory. The specified relative path cannot break out of the Task's working directory (for example by using '..').")
  filePath?: string;

  @doc("The file permission mode attribute in octal format. This property applies only to files being downloaded to Linux Compute Nodes. It will be ignored if it is specified for a resourceFile which will be downloaded to a Windows Compute Node. If this property is not specified for a Linux Compute Node, then a default value of 0770 is applied to the file.")
  fileMode?: string;

  @doc("The reference to the user assigned identity to use to access Azure Blob Storage specified by storageContainerUrl or httpUrl.")
  identityReference?: BatchNodeIdentityReference;
}

@doc("""
  On every file uploads, Batch service writes two log files to the compute node, 'fileuploadout.txt' and 'fileuploaderr.txt'. These log files are used to learn more about a specific failure.
  """)
model OutputFile {
  @doc("A pattern indicating which file(s) to upload. Both relative and absolute paths are supported. Relative paths are relative to the Task working directory. The following wildcards are supported: * matches 0 or more characters (for example pattern abc* would match abc or abcdef), ** matches any directory, ? matches any single character, [abc] matches one character in the brackets, and [a-c] matches one character in the range. Brackets can include a negation to match any character not specified (for example [!abc] matches any character but a, b, or c). If a file name starts with \".\" it is ignored by default but may be matched by specifying it explicitly (for example *.gif will not match .a.gif, but .*.gif will). A simple example: **\\*.txt matches any file that does not start in '.' and ends with .txt in the Task working directory or any subdirectory. If the filename contains a wildcard character it can be escaped using brackets (for example abc[*] would match a file named abc*). Note that both \\ and / are treated as directory separators on Windows, but only / is on Linux. Environment variables (%var% on Windows or $var on Linux) are expanded prior to the pattern being applied.")
  filePattern: string;

  @doc("The destination for the output file(s).")
  destination: OutputFileDestination;

  @doc("Additional options for the upload operation, including under what conditions to perform the upload.")
  uploadOptions: OutputFileUploadConfig;
}

@doc("The destination to which a file should be uploaded.")
model OutputFileDestination {
  @doc("A location in Azure blob storage to which files are uploaded.")
  container?: OutputFileBlobContainerDestination;
}

@doc("Specifies a file upload destination within an Azure blob storage container.")
model OutputFileBlobContainerDestination {
  @doc("The destination blob or virtual directory within the Azure Storage container. If filePattern refers to a specific file (i.e. contains no wildcards), then path is the name of the blob to which to upload that file. If filePattern contains one or more wildcards (and therefore may match multiple files), then path is the name of the blob virtual directory (which is prepended to each blob name) to which to upload the file(s). If omitted, file(s) are uploaded to the root of the container with a blob name matching their file name.")
  path?: string;

  @doc("The URL of the container within Azure Blob Storage to which to upload the file(s). If not using a managed identity, the URL must include a Shared Access Signature (SAS) granting write permissions to the container.")
  @clientName("containerUri", "csharp")
  containerUrl: url;

  @doc("The reference to the user assigned identity to use to access Azure Blob Storage specified by containerUrl. The identity must have write access to the Azure Blob Storage container.")
  identityReference?: BatchNodeIdentityReference;

  @doc("A list of name-value pairs for headers to be used in uploading output files. These headers will be specified when uploading files to Azure Storage. Official document on allowed headers when uploading blobs: https://learn.microsoft.com/rest/api/storageservices/put-blob#request-headers-all-blob-types.")
  uploadHeaders?: OutputFileUploadHeader[];
}

@doc("An HTTP header name-value pair")
model OutputFileUploadHeader {
  @doc("The case-insensitive name of the header to be used while uploading output files.")
  name: string;

  @doc("The value of the header to be used while uploading output files.")
  value?: string;
}

@doc("""
  Options for an output file upload operation, including under what conditions
  to perform the upload.
  """)
model OutputFileUploadConfig {
  @doc("The conditions under which the Task output file or set of files should be uploaded. The default is taskcompletion.")
  uploadCondition: OutputFileUploadCondition;
}

@doc("An environment variable to be set on a Task process.")
model EnvironmentSetting {
  @doc("The name of the environment variable.")
  name: string;

  @doc("The value of the environment variable.")
  value?: string;
}

@doc("Execution constraints to apply to a Task.")
model BatchTaskConstraints {
  @doc("The maximum elapsed time that the Task may run, measured from the time the Task starts. If the Task does not complete within the time limit, the Batch service terminates it. If this is not specified, there is no time limit on how long the Task may run.")
  maxWallClockTime?: duration;

  @doc("The minimum time to retain the Task directory on the Compute Node where it ran, from the time it completes execution. After this time, the Batch service may delete the Task directory and all its contents. The default is 7 days, i.e. the Task directory will be retained for 7 days unless the Compute Node is removed or the Job is deleted.")
  retentionTime?: duration;

  @doc("The maximum number of times the Task may be retried. The Batch service retries a Task if its exit code is nonzero. Note that this value specifically controls the number of retries for the Task executable due to a nonzero exit code. The Batch service will try the Task once, and may then retry up to this limit. For example, if the maximum retry count is 3, Batch tries the Task up to 4 times (one initial try and 3 retries). If the maximum retry count is 0, the Batch service does not retry the Task after the first attempt. If the maximum retry count is -1, the Batch service retries the Task without limit, however this is not recommended for a start task or any task. The default value is 0 (no retries).")
  maxTaskRetryCount?: int32;
}

@doc("The definition of the user identity under which the Task is run. Specify either the userName or autoUser property, but not both.")
model UserIdentity {
  @doc("The name of the user identity under which the Task is run. The userName and autoUser properties are mutually exclusive; you must specify one but not both.")
  username?: string;

  @doc("The auto user under which the Task is run. The userName and autoUser properties are mutually exclusive; you must specify one but not both.")
  autoUser?: AutoUserSpecification;
}

@doc("Specifies the security settings like secure boot and vTPM used while creating the virtual machine.")
model BatchUefiSettings {
  @doc("Specifies whether secure boot should be enabled on the virtual machine.")
  secureBootEnabled?: boolean;

  @doc("Specifies whether vTPM should be enabled on the virtual machine.")
  vTpmEnabled?: boolean;
}

@doc("""
  Specifies the options for the auto user that runs an Azure Batch Task.
  """)
model AutoUserSpecification {
  @doc("The scope for the auto user. The default value is pool. If the pool is running Windows a value of Task should be specified if stricter isolation between tasks is required. For example, if the task mutates the registry in a way which could impact other tasks, or if certificates have been specified on the pool which should not be accessible by normal tasks but should be accessible by StartTasks.")
  scope?: AutoUserScope;

  @doc("The elevation level of the auto user. The default value is nonAdmin.")
  elevationLevel?: ElevationLevel;
}

@doc("A reference to an Package to be deployed to Compute Nodes.")
model BatchApplicationPackageReference {
  @doc("The ID of the application to deploy. When creating a pool, the package's application ID must be fully qualified (/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Batch/batchAccounts/{accountName}/applications/{applicationName}).")
  applicationId: string;

  @doc("The version of the application to deploy. If omitted, the default version is deployed. If this is omitted on a Pool, and no default version is specified for this application, the request fails with the error code InvalidApplicationPackageReferences and HTTP status code 409. If this is omitted on a Task, and no default version is specified for this application, the Task fails with a pre-processing error.")
  version?: string;
}

@doc("""
  The settings for an authentication token that the Task can use to perform Batch
  service operations.
  """)
model AuthenticationTokenSettings {
  @doc("The Batch resources to which the token grants access. The authentication token grants access to a limited set of Batch service operations. Currently the only supported value for the access property is 'job', which grants access to all operations related to the Job which contains the Task.")
  access?: BatchAccessScope[];
}

@doc("""
  A Job Preparation Task to run before any Tasks of the Job on any given Compute Node.
  You can use Job Preparation to prepare a Node to run Tasks for the Job.
  Activities commonly performed in Job Preparation include: Downloading common
  resource files used by all the Tasks in the Job. The Job Preparation Task can
  download these common resource files to the shared location on the Node.
  (AZ_BATCH_NODE_ROOT_DIR\\shared), or starting a local service on the Node so
  that all Tasks of that Job can communicate with it. If the Job Preparation Task
  fails (that is, exhausts its retry count before exiting with exit code 0),
  Batch will not run Tasks of this Job on the Node. The Compute Node remains
  ineligible to run Tasks of this Job until it is reimaged. The Compute Node
  remains active and can be used for other Jobs. The Job Preparation Task can run
  multiple times on the same Node. Therefore, you should write the Job
  Preparation Task to handle re-execution. If the Node is rebooted, the Job
  Preparation Task is run again on the Compute Node before scheduling any other
  Task of the Job, if rerunOnNodeRebootAfterSuccess is true or if the Job
  Preparation Task did not previously complete. If the Node is reimaged, the Job
  Preparation Task is run again before scheduling any Task of the Job. Batch will
  retry Tasks when a recovery operation is triggered on a Node. Examples of
  recovery operations include (but are not limited to) when an unhealthy Node is
  rebooted or a Compute Node disappeared due to host failure. Retries due to
  recovery operations are independent of and are not counted against the
  maxTaskRetryCount. Even if the maxTaskRetryCount is 0, an internal retry due to
  a recovery operation may occur. Because of this, all Tasks should be
  idempotent. This means Tasks need to tolerate being interrupted and restarted
  without causing any corruption or duplicate data. The best practice for long
  running Tasks is to use some form of checkpointing.
  """)
model BatchJobPreparationTask {
  @doc("A string that uniquely identifies the Job Preparation Task within the Job. The ID can contain any combination of alphanumeric characters including hyphens and underscores and cannot contain more than 64 characters. If you do not specify this property, the Batch service assigns a default value of 'jobpreparation'. No other Task in the Job can have the same ID as the Job Preparation Task. If you try to submit a Task with the same id, the Batch service rejects the request with error code TaskIdSameAsJobPreparationTask; if you are calling the REST API directly, the HTTP status code is 409 (Conflict).")
  id?: string;

  @doc("The command line of the Job Preparation Task. The command line does not run under a shell, and therefore cannot take advantage of shell features such as environment variable expansion. If you want to take advantage of such features, you should invoke the shell in the command line, for example using \"cmd /c MyCommand\" in Windows or \"/bin/sh -c MyCommand\" in Linux. If the command line refers to file paths, it should use a relative path (relative to the Task working directory), or use the Batch provided environment variable (https://learn.microsoft.com/azure/batch/batch-compute-node-environment-variables).")
  commandLine: string;

  @doc("The settings for the container under which the Job Preparation Task runs. When this is specified, all directories recursively below the AZ_BATCH_NODE_ROOT_DIR (the root of Azure Batch directories on the node) are mapped into the container, all Task environment variables are mapped into the container, and the Task command line is executed in the container. Files produced in the container outside of AZ_BATCH_NODE_ROOT_DIR might not be reflected to the host disk, meaning that Batch file APIs will not be able to access those files.")
  containerSettings?: BatchTaskContainerSettings;

  @doc("A list of files that the Batch service will download to the Compute Node before running the command line. Files listed under this element are located in the Task's working directory.  There is a maximum size for the list of resource files.  When the max size is exceeded, the request will fail and the response error code will be RequestEntityTooLarge. If this occurs, the collection of ResourceFiles must be reduced in size. This can be achieved using .zip files, Application Packages, or Docker Containers.")
  resourceFiles?: ResourceFile[];

  @doc("A list of environment variable settings for the Job Preparation Task.")
  environmentSettings?: EnvironmentSetting[];

  @doc("Constraints that apply to the Job Preparation Task.")
  constraints?: BatchTaskConstraints;

  @doc("Whether the Batch service should wait for the Job Preparation Task to complete successfully before scheduling any other Tasks of the Job on the Compute Node. A Job Preparation Task has completed successfully if it exits with exit code 0. If true and the Job Preparation Task fails on a Node, the Batch service retries the Job Preparation Task up to its maximum retry count (as specified in the constraints element). If the Task has still not completed successfully after all retries, then the Batch service will not schedule Tasks of the Job to the Node. The Node remains active and eligible to run Tasks of other Jobs. If false, the Batch service will not wait for the Job Preparation Task to complete. In this case, other Tasks of the Job can start executing on the Compute Node while the Job Preparation Task is still running; and even if the Job Preparation Task fails, new Tasks will continue to be scheduled on the Compute Node. The default value is true.")
  waitForSuccess?: boolean;

  @doc("The user identity under which the Job Preparation Task runs. If omitted, the Task runs as a non-administrative user unique to the Task on Windows Compute Nodes, or a non-administrative user unique to the Pool on Linux Compute Nodes.")
  userIdentity?: UserIdentity;

  @doc("Whether the Batch service should rerun the Job Preparation Task after a Compute Node reboots. The Job Preparation Task is always rerun if a Compute Node is reimaged, or if the Job Preparation Task did not complete (e.g. because the reboot occurred while the Task was running). Therefore, you should always write a Job Preparation Task to be idempotent and to behave correctly if run multiple times. The default value is true.")
  rerunOnNodeRebootAfterSuccess?: boolean;
}

@doc("""
  A Job Release Task to run on Job completion on any Compute Node where the Job has run.
  The Job Release Task runs when the Job ends, because of one of the following:
  The user calls the Terminate Job API, or the Delete Job API while the Job is
  still active, the Job's maximum wall clock time constraint is reached, and the
  Job is still active, or the Job's Job Manager Task completed, and the Job is
  configured to terminate when the Job Manager completes. The Job Release Task
  runs on each Node where Tasks of the Job have run and the Job Preparation Task
  ran and completed. If you reimage a Node after it has run the Job Preparation
  Task, and the Job ends without any further Tasks of the Job running on that
  Node (and hence the Job Preparation Task does not re-run), then the Job Release
  Task does not run on that Compute Node. If a Node reboots while the Job Release
  Task is still running, the Job Release Task runs again when the Compute Node
  starts up. The Job is not marked as complete until all Job Release Tasks have
  completed. The Job Release Task runs in the background. It does not occupy a
  scheduling slot; that is, it does not count towards the taskSlotsPerNode limit
  specified on the Pool.
  """)
model BatchJobReleaseTask {
  @doc("A string that uniquely identifies the Job Release Task within the Job. The ID can contain any combination of alphanumeric characters including hyphens and underscores and cannot contain more than 64 characters. If you do not specify this property, the Batch service assigns a default value of 'jobrelease'. No other Task in the Job can have the same ID as the Job Release Task. If you try to submit a Task with the same id, the Batch service rejects the request with error code TaskIdSameAsJobReleaseTask; if you are calling the REST API directly, the HTTP status code is 409 (Conflict).")
  id?: string;

  @doc("The command line of the Job Release Task. The command line does not run under a shell, and therefore cannot take advantage of shell features such as environment variable expansion. If you want to take advantage of such features, you should invoke the shell in the command line, for example using \"cmd /c MyCommand\" in Windows or \"/bin/sh -c MyCommand\" in Linux. If the command line refers to file paths, it should use a relative path (relative to the Task working directory), or use the Batch provided environment variable (https://learn.microsoft.com/azure/batch/batch-compute-node-environment-variables).")
  commandLine: string;

  @doc("The settings for the container under which the Job Release Task runs. When this is specified, all directories recursively below the AZ_BATCH_NODE_ROOT_DIR (the root of Azure Batch directories on the node) are mapped into the container, all Task environment variables are mapped into the container, and the Task command line is executed in the container. Files produced in the container outside of AZ_BATCH_NODE_ROOT_DIR might not be reflected to the host disk, meaning that Batch file APIs will not be able to access those files.")
  containerSettings?: BatchTaskContainerSettings;

  @doc("A list of files that the Batch service will download to the Compute Node before running the command line.  There is a maximum size for the list of resource files.  When the max size is exceeded, the request will fail and the response error code will be RequestEntityTooLarge. If this occurs, the collection of ResourceFiles must be reduced in size. This can be achieved using .zip files, Application Packages, or Docker Containers. Files listed under this element are located in the Task's working directory.")
  resourceFiles?: ResourceFile[];

  @doc("A list of environment variable settings for the Job Release Task.")
  environmentSettings?: EnvironmentSetting[];

  @doc("The maximum elapsed time that the Job Release Task may run on a given Compute Node, measured from the time the Task starts. If the Task does not complete within the time limit, the Batch service terminates it. The default value is 15 minutes. You may not specify a timeout longer than 15 minutes. If you do, the Batch service rejects it with an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  maxWallClockTime?: duration;

  @doc("The minimum time to retain the Task directory for the Job Release Task on the Compute Node. After this time, the Batch service may delete the Task directory and all its contents. The default is 7 days, i.e. the Task directory will be retained for 7 days unless the Compute Node is removed or the Job is deleted.")
  retentionTime?: duration;

  @doc("The user identity under which the Job Release Task runs. If omitted, the Task runs as a non-administrative user unique to the Task.")
  userIdentity?: UserIdentity;
}

@doc("Specifies how a Job should be assigned to a Pool.")
model BatchPoolInfo {
  @doc("The ID of an existing Pool. All the Tasks of the Job will run on the specified Pool. You must ensure that the Pool referenced by this property exists. If the Pool does not exist at the time the Batch service tries to schedule a Job, no Tasks for the Job will run until you create a Pool with that id. Note that the Batch service will not reject the Job request; it will simply not run Tasks until the Pool exists. You must specify either the Pool ID or the auto Pool specification, but not both.")
  poolId?: string;

  @doc("Characteristics for a temporary 'auto pool'. The Batch service will create this auto Pool when the Job is submitted. If auto Pool creation fails, the Batch service moves the Job to a completed state, and the Pool creation error is set in the Job's scheduling error property. The Batch service manages the lifetime (both creation and, unless keepAlive is specified, deletion) of the auto Pool. Any user actions that affect the lifetime of the auto Pool while the Job is active will result in unexpected behavior. You must specify either the Pool ID or the auto Pool specification, but not both.")
  autoPoolSpecification?: BatchAutoPoolSpecification;
}

@doc("""
  Specifies characteristics for a temporary 'auto pool'. The Batch service will
  create this auto Pool when the Job is submitted.
  """)
model BatchAutoPoolSpecification {
  @doc("A prefix to be added to the unique identifier when a Pool is automatically created. The Batch service assigns each auto Pool a unique identifier on creation. To distinguish between Pools created for different purposes, you can specify this element to add a prefix to the ID that is assigned. The prefix can be up to 20 characters long.")
  autoPoolIdPrefix?: string;

  @doc("The minimum lifetime of created auto Pools, and how multiple Jobs on a schedule are assigned to Pools.")
  poolLifetimeOption: BatchPoolLifetimeOption;

  @doc("Whether to keep an auto Pool alive after its lifetime expires. If false, the Batch service deletes the Pool once its lifetime (as determined by the poolLifetimeOption setting) expires; that is, when the Job or Job Schedule completes. If true, the Batch service does not delete the Pool automatically. It is up to the user to delete auto Pools created with this option.")
  keepAlive?: boolean;

  @doc("The Pool specification for the auto Pool.")
  pool?: BatchPoolSpecification;
}

@doc("Specification for creating a new Pool.")
model BatchPoolSpecification {
  @doc("The display name for the Pool. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  displayName?: string;

  @doc("The size of the virtual machines in the Pool. All virtual machines in a Pool are the same size. For information about available sizes of virtual machines in Pools, see Choose a VM size for Compute Nodes in an Azure Batch Pool (https://learn.microsoft.com/azure/batch/batch-pool-vm-sizes).")
  vmSize: string;

  @doc("The virtual machine configuration for the Pool. This property must be specified.")
  virtualMachineConfiguration?: VirtualMachineConfiguration;

  @doc("The number of task slots that can be used to run concurrent tasks on a single compute node in the pool. The default value is 1. The maximum value is the smaller of 4 times the number of cores of the vmSize of the pool or 256.")
  taskSlotsPerNode?: int32;

  @doc("How Tasks are distributed across Compute Nodes in a Pool. If not specified, the default is spread.")
  taskSchedulingPolicy?: BatchTaskSchedulingPolicy;

  @doc("The timeout for allocation of Compute Nodes to the Pool. This timeout applies only to manual scaling; it has no effect when enableAutoScale is set to true. The default value is 15 minutes. The minimum value is 5 minutes. If you specify a value less than 5 minutes, the Batch service rejects the request with an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  resizeTimeout?: duration;

  @doc("The user-specified tags associated with the pool.The user-defined tags to be associated with the Azure Batch Pool. When specified, these tags are propagated to the backing Azure resources associated with the pool. This property can only be specified when the Batch account was created with the poolAllocationMode property set to 'UserSubscription'.")
  resourceTags?: string;

  @doc("The desired number of dedicated Compute Nodes in the Pool. This property must not be specified if enableAutoScale is set to true. If enableAutoScale is set to false, then you must set either targetDedicatedNodes, targetLowPriorityNodes, or both.")
  targetDedicatedNodes?: int32;

  @doc("The desired number of Spot/Low-priority Compute Nodes in the Pool. This property must not be specified if enableAutoScale is set to true. If enableAutoScale is set to false, then you must set either targetDedicatedNodes, targetLowPriorityNodes, or both.")
  targetLowPriorityNodes?: int32;

  @doc("Whether the Pool size should automatically adjust over time. If false, at least one of targetDedicatedNodes and targetLowPriorityNodes must be specified. If true, the autoScaleFormula element is required. The Pool automatically resizes according to the formula. The default value is false.")
  enableAutoScale?: boolean;

  @doc("The formula for the desired number of Compute Nodes in the Pool. This property must not be specified if enableAutoScale is set to false. It is required if enableAutoScale is set to true. The formula is checked for validity before the Pool is created. If the formula is not valid, the Batch service rejects the request with detailed error information.")
  autoScaleFormula?: string;

  @doc("The time interval at which to automatically adjust the Pool size according to the autoscale formula. The default value is 15 minutes. The minimum and maximum value are 5 minutes and 168 hours respectively. If you specify a value less than 5 minutes or greater than 168 hours, the Batch service rejects the request with an invalid property value error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  autoScaleEvaluationInterval?: duration;

  @doc("Whether the Pool permits direct communication between Compute Nodes. Enabling inter-node communication limits the maximum size of the Pool due to deployment restrictions on the Compute Nodes of the Pool. This may result in the Pool not reaching its desired size. The default value is false.")
  enableInterNodeCommunication?: boolean;

  @doc("The network configuration for the Pool.")
  networkConfiguration?: NetworkConfiguration;

  @doc("A Task to run on each Compute Node as it joins the Pool. The Task runs when the Compute Node is added to the Pool or when the Compute Node is restarted.")
  startTask?: BatchStartTask;

  @doc("""
    For Windows Nodes, the Batch service installs the Certificates to the specified Certificate store and location. For Linux Compute Nodes, the Certificates are stored in a directory inside the Task working directory and an environment variable AZ_BATCH_CERTIFICATES_DIR is supplied to the Task to query for this location. For Certificates with visibility of 'remoteUser', a 'certs' directory is created in the user's home directory (e.g., /home/{user-name}/certs) and Certificates are placed in that directory.
    Warning: This property is deprecated and will be removed after February, 2024.
    Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead.
    """)
  certificateReferences?: BatchCertificateReference[];

  @doc("The list of Packages to be installed on each Compute Node in the Pool. When creating a pool, the package's application ID must be fully qualified (/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Batch/batchAccounts/{accountName}/applications/{applicationName}). Changes to Package references affect all new Nodes joining the Pool, but do not affect Compute Nodes that are already in the Pool until they are rebooted or reimaged. There is a maximum of 10 Package references on any given Pool.")
  applicationPackageReferences?: BatchApplicationPackageReference[];

  @doc("The list of user Accounts to be created on each Compute Node in the Pool.")
  userAccounts?: UserAccount[];

  @doc("A list of name-value pairs associated with the Pool as metadata. The Batch service does not assign any meaning to metadata; it is solely for the use of user code.")
  metadata?: BatchMetadataItem[];

  @doc("A list of file systems to mount on each node in the pool. This supports Azure Files, NFS, CIFS/SMB, and Blobfuse.")
  mountConfiguration?: MountConfiguration[];

  @doc("The desired node communication mode for the pool. If omitted, the default value is Default.")
  targetNodeCommunicationMode?: BatchNodeCommunicationMode;

  @doc("The upgrade policy for the Pool. Describes an upgrade policy - automatic, manual, or rolling.")
  upgradePolicy?: UpgradePolicy;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("""
  The configuration for Compute Nodes in a Pool based on the Azure Virtual
  Machines infrastructure.
  """)
model VirtualMachineConfiguration {
  @doc("A reference to the Azure Virtual Machines Marketplace Image or the custom Virtual Machine Image to use.")
  imageReference: BatchVmImageReference;

  @doc("The SKU of the Batch Compute Node agent to be provisioned on Compute Nodes in the Pool. The Batch Compute Node agent is a program that runs on each Compute Node in the Pool, and provides the command-and-control interface between the Compute Node and the Batch service. There are different implementations of the Compute Node agent, known as SKUs, for different operating systems. You must specify a Compute Node agent SKU which matches the selected Image reference. To get the list of supported Compute Node agent SKUs along with their list of verified Image references, see the 'List supported Compute Node agent SKUs' operation.")
  @clientName("nodeAgentSkuId", "!go")
  nodeAgentSKUId: string;

  @doc("Windows operating system settings on the virtual machine. This property must not be specified if the imageReference property specifies a Linux OS Image.")
  windowsConfiguration?: WindowsConfiguration;

  @doc("The configuration for data disks attached to the Compute Nodes in the Pool. This property must be specified if the Compute Nodes in the Pool need to have empty data disks attached to them. This cannot be updated. Each Compute Node gets its own disk (the disk is not a file share). Existing disks cannot be attached, each attached disk is empty. When the Compute Node is removed from the Pool, the disk and all data associated with it is also deleted. The disk is not formatted after being attached, it must be formatted before use - for more information see https://learn.microsoft.com/azure/virtual-machines/linux/classic/attach-disk#initialize-a-new-data-disk-in-linux and https://learn.microsoft.com/azure/virtual-machines/windows/attach-disk-ps#add-an-empty-data-disk-to-a-virtual-machine.")
  dataDisks?: DataDisk[];

  @doc("""
    This only applies to Images that contain the Windows operating system, and
    should only be used when you hold valid on-premises licenses for the Compute
    Nodes which will be deployed. If omitted, no on-premises licensing discount is
    applied. Values are:
    
     Windows_Server - The on-premises license is for Windows
    Server.
     Windows_Client - The on-premises license is for Windows Client.
    
    """)
  licenseType?: string;

  @doc("The container configuration for the Pool. If specified, setup is performed on each Compute Node in the Pool to allow Tasks to run in containers. All regular Tasks and Job manager Tasks run on this Pool must specify the containerSettings property, and all other Tasks may specify it.")
  containerConfiguration?: BatchContainerConfiguration;

  @doc("The disk encryption configuration for the pool. If specified, encryption is performed on each node in the pool during node provisioning.")
  diskEncryptionConfiguration?: DiskEncryptionConfiguration;

  @doc("The node placement configuration for the pool. This configuration will specify rules on how nodes in the pool will be physically allocated.")
  nodePlacementConfiguration?: BatchNodePlacementConfiguration;

  @doc("The virtual machine extension for the pool. If specified, the extensions mentioned in this configuration will be installed on each node.")
  extensions?: VMExtension[];

  @doc("Settings for the operating system disk of the Virtual Machine.")
  @clientName("OsDisk")
  osDisk?: BatchOsDisk;

  @doc("Specifies the security profile settings for the virtual machine or virtual machine scale set.")
  securityProfile?: SecurityProfile;

  @doc("Specifies the service artifact reference id used to set same image version for all virtual machines in the scale set when using 'latest' image version. The service artifact reference id in the form of /subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Compute/galleries/{galleryName}/serviceArtifacts/{serviceArtifactName}/vmArtifactsProfiles/{vmArtifactsProfilesName}")
  serviceArtifactReference?: ServiceArtifactReference;
}

@doc("Windows operating system settings to apply to the virtual machine.")
model WindowsConfiguration {
  @doc("Whether automatic updates are enabled on the virtual machine. If omitted, the default value is true.")
  enableAutomaticUpdates?: boolean;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("""
  Settings which will be used by the data disks associated to Compute Nodes in
  the Pool. When using attached data disks, you need to mount and format the
  disks from within a VM to use them.
  """)
model DataDisk {
  @doc("The logical unit number. The logicalUnitNumber is used to uniquely identify each data disk. If attaching multiple disks, each should have a distinct logicalUnitNumber. The value must be between 0 and 63, inclusive.")
  @clientName("logicalUnitNumber")
  lun: int32;

  @doc("The type of caching to be enabled for the data disks. The default value for caching is readwrite. For information about the caching options see: https://blogs.msdn.microsoft.com/windowsazurestorage/2012/06/27/exploring-windows-azure-drives-disks-and-images/.")
  caching?: CachingType;

  @doc("The initial disk size in gigabytes.")
  @clientName("diskSizeGb", "!go")
  diskSizeGB: int32;

  @doc("The storage Account type to be used for the data disk. If omitted, the default is \"standard_lrs\".")
  storageAccountType?: StorageAccountType;
}

@doc("The configuration for container-enabled Pools.")
model BatchContainerConfiguration {
  @doc("The container technology to be used.")
  type: ContainerType;

  @doc("The collection of container Image names. This is the full Image reference, as would be specified to \"docker pull\". An Image will be sourced from the default Docker registry unless the Image is fully qualified with an alternative registry.")
  containerImageNames?: string[];

  @doc("Additional private registries from which containers can be pulled. If any Images must be downloaded from a private registry which requires credentials, then those credentials must be provided here.")
  containerRegistries?: ContainerRegistryReference[];
}

@doc("""
  The disk encryption configuration applied on compute nodes in the pool.
  Disk encryption configuration is not supported on Linux pool created with
  Azure Compute Gallery Image.
  """)
model DiskEncryptionConfiguration {
  @doc("The list of disk targets Batch Service will encrypt on the compute node. The list of disk targets Batch Service will encrypt on the compute node.")
  targets?: DiskEncryptionTarget[];
}

@doc("""
  For regional placement, nodes in the pool will be allocated in the same region.
  For zonal placement, nodes in the pool will be spread across different zones
  with best effort balancing.
  """)
model BatchNodePlacementConfiguration {
  @doc("Node placement Policy type on Batch Pools. Allocation policy used by Batch Service to provision the nodes. If not specified, Batch will use the regional policy.")
  policy?: BatchNodePlacementPolicyType;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("The configuration for virtual machine extensions.")
model VMExtension {
  @doc("The name of the virtual machine extension.")
  name: string;

  @doc("The name of the extension handler publisher.")
  publisher: string;

  @doc("The type of the extension.")
  type: string;

  @doc("The version of script handler.")
  typeHandlerVersion?: string;

  @doc("Indicates whether the extension should use a newer minor version if one is available at deployment time. Once deployed, however, the extension will not upgrade minor versions unless redeployed, even with this property set to true.")
  autoUpgradeMinorVersion?: boolean;

  @doc("Indicates whether the extension should be automatically upgraded by the platform if there is a newer version of the extension available.")
  enableAutomaticUpgrade?: boolean;

  @doc("JSON formatted public settings for the extension.")
  settings?: Record<string>;

  @doc("The extension can contain either protectedSettings or protectedSettingsFromKeyVault or no protected settings at all.")
  protectedSettings?: Record<string>;

  @doc("The collection of extension names. Collection of extension names after which this extension needs to be provisioned.")
  provisionAfterExtensions?: string[];
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("Settings for the operating system disk of the compute node (VM).")
model BatchOsDisk {
  @doc("Specifies the ephemeral Disk Settings for the operating system disk used by the compute node (VM).")
  ephemeralOSDiskSettings?: BatchDiffDiskSettings;

  @doc("Specifies the caching requirements. Possible values are: None, ReadOnly, ReadWrite. The default values are: None for Standard storage. ReadOnly for Premium storage.")
  caching?: CachingType;

  @doc("The initial disk size in GB when creating new OS disk.")
  diskSizeGB?: int32;

  @doc("The managed disk parameters.")
  managedDisk?: ManagedDisk;

  @doc("Specifies whether writeAccelerator should be enabled or disabled on the disk.")
  writeAcceleratorEnabled?: boolean;
}

@doc("""
  Specifies the ephemeral Disk Settings for the operating system disk used by the
  compute node (VM).
  """)
model BatchDiffDiskSettings {
  @doc("Specifies the ephemeral disk placement for operating system disk for all VMs in the pool. This property can be used by user in the request to choose the location e.g., cache disk space for Ephemeral OS disk provisioning. For more information on Ephemeral OS disk size requirements, please refer to Ephemeral OS disk size requirements for Windows VMs at https://learn.microsoft.com/azure/virtual-machines/windows/ephemeral-os-disks#size-requirements and Linux VMs at https://learn.microsoft.com/azure/virtual-machines/linux/ephemeral-os-disks#size-requirements.")
  placement?: DiffDiskPlacement;
}

@doc("Specifies how Tasks should be distributed across Compute Nodes.")
model BatchTaskSchedulingPolicy {
  @doc("How Tasks are distributed across Compute Nodes in a Pool. If not specified, the default is spread.")
  nodeFillType: BatchNodeFillType;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("The network configuration for a Pool.")
model NetworkConfiguration {
  @doc("The ARM resource identifier of the virtual network subnet which the Compute Nodes of the Pool will join. This is of the form /subscriptions/{subscription}/resourceGroups/{group}/providers/{provider}/virtualNetworks/{network}/subnets/{subnet}. The virtual network must be in the same region and subscription as the Azure Batch Account. The specified subnet should have enough free IP addresses to accommodate the number of Compute Nodes in the Pool. If the subnet doesn't have enough free IP addresses, the Pool will partially allocate Nodes and a resize error will occur. The 'MicrosoftAzureBatch' service principal must have the 'Classic Virtual Machine Contributor' Role-Based Access Control (RBAC) role for the specified VNet. The specified subnet must allow communication from the Azure Batch service to be able to schedule Tasks on the Nodes. This can be verified by checking if the specified VNet has any associated Network Security Groups (NSG). If communication to the Nodes in the specified subnet is denied by an NSG, then the Batch service will set the state of the Compute Nodes to unusable. Only ARM virtual networks ('Microsoft.Network/virtualNetworks') are supported. If the specified VNet has any associated Network Security Groups (NSG), then a few reserved system ports must be enabled for inbound communication, including ports 29876 and 29877. Also enable outbound connections to Azure Storage on port 443. For more details see: https://learn.microsoft.com/azure/batch/nodes-and-pools#virtual-network-vnet-and-firewall-configuration")
  subnetId?: string;

  @doc("The scope of dynamic vnet assignment.")
  @clientName("dynamicVnetAssignmentScope")
  dynamicVNetAssignmentScope?: DynamicVNetAssignmentScope;

  @doc("The configuration for endpoints on Compute Nodes in the Batch Pool.")
  endpointConfiguration?: BatchPoolEndpointConfiguration;

  @doc("The Public IPAddress configuration for Compute Nodes in the Batch Pool.")
  @clientName("publicIpAddressConfiguration", "!go")
  publicIPAddressConfiguration?: BatchPublicIpAddressConfiguration;

  @doc("Whether this pool should enable accelerated networking. Accelerated networking enables single root I/O virtualization (SR-IOV) to a VM, which may lead to improved networking performance. For more details, see: https://learn.microsoft.com/azure/virtual-network/accelerated-networking-overview.")
  enableAcceleratedNetworking?: boolean;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("The endpoint configuration for a Pool.")
model BatchPoolEndpointConfiguration {
  @doc("A list of inbound NAT Pools that can be used to address specific ports on an individual Compute Node externally. The maximum number of inbound NAT Pools per Batch Pool is 5. If the maximum number of inbound NAT Pools is exceeded the request fails with HTTP status code 400. This cannot be specified if the IPAddressProvisioningType is NoPublicIPAddresses.")
  @clientName("inboundNatPools", "!go")
  inboundNATPools: BatchInboundNatPool[];
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("""
  A inbound NAT Pool that can be used to address specific ports on Compute Nodes
  in a Batch Pool externally.
  """)
model BatchInboundNatPool {
  @doc("The name of the endpoint. The name must be unique within a Batch Pool, can contain letters, numbers, underscores, periods, and hyphens. Names must start with a letter or number, must end with a letter, number, or underscore, and cannot exceed 77 characters.  If any invalid values are provided the request fails with HTTP status code 400.")
  name: string;

  @doc("The protocol of the endpoint.")
  protocol: InboundEndpointProtocol;

  @doc("The port number on the Compute Node. This must be unique within a Batch Pool. Acceptable values are between 1 and 65535 except for 29876 and 29877 as these are reserved. If any reserved values are provided the request fails with HTTP status code 400.")
  backendPort: int32;

  @doc("The first port number in the range of external ports that will be used to provide inbound access to the backendPort on individual Compute Nodes. Acceptable values range between 1 and 65534 except ports from 50000 to 55000 which are reserved. All ranges within a Pool must be distinct and cannot overlap. Each range must contain at least 40 ports. If any reserved or overlapping values are provided the request fails with HTTP status code 400.")
  frontendPortRangeStart: int32;

  @doc("The last port number in the range of external ports that will be used to provide inbound access to the backendPort on individual Compute Nodes. Acceptable values range between 1 and 65534 except ports from 50000 to 55000 which are reserved by the Batch service. All ranges within a Pool must be distinct and cannot overlap. Each range must contain at least 40 ports. If any reserved or overlapping values are provided the request fails with HTTP status code 400.")
  frontendPortRangeEnd: int32;

  @doc("A list of network security group rules that will be applied to the endpoint. The maximum number of rules that can be specified across all the endpoints on a Batch Pool is 25. If no network security group rules are specified, a default rule will be created to allow inbound access to the specified backendPort. If the maximum number of network security group rules is exceeded the request fails with HTTP status code 400.")
  networkSecurityGroupRules?: NetworkSecurityGroupRule[];
}

@doc("A network security group rule to apply to an inbound endpoint.")
model NetworkSecurityGroupRule {
  @doc("The priority for this rule. Priorities within a Pool must be unique and are evaluated in order of priority. The lower the number the higher the priority. For example, rules could be specified with order numbers of 150, 250, and 350. The rule with the order number of 150 takes precedence over the rule that has an order of 250. Allowed priorities are 150 to 4096. If any reserved or duplicate values are provided the request fails with HTTP status code 400.")
  priority: int32;

  @doc("The action that should be taken for a specified IP address, subnet range or tag.")
  access: NetworkSecurityGroupRuleAccess;

  @doc("The source address prefix or tag to match for the rule. Valid values are a single IP address (i.e. 10.10.10.10), IP subnet (i.e. 192.168.1.0/24), default tag, or * (for all addresses).  If any other values are provided the request fails with HTTP status code 400.")
  sourceAddressPrefix: string;

  @doc("The source port ranges to match for the rule. Valid values are '*' (for all ports 0 - 65535), a specific port (i.e. 22), or a port range (i.e. 100-200). The ports must be in the range of 0 to 65535. Each entry in this collection must not overlap any other entry (either a range or an individual port). If any other values are provided the request fails with HTTP status code 400. The default value is '*'.")
  sourcePortRanges?: string[];
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("The public IP Address configuration of the networking configuration of a Pool.")
model BatchPublicIpAddressConfiguration {
  @doc("The provisioning type for Public IP Addresses for the Pool. The default value is BatchManaged.")
  @clientName("IpAddressProvisioningType")
  provision?: IpAddressProvisioningType;

  @doc("The list of public IPs which the Batch service will use when provisioning Compute Nodes. The number of IPs specified here limits the maximum size of the Pool - 100 dedicated nodes or 100 Spot/Low-priority nodes can be allocated for each public IP. For example, a pool needing 250 dedicated VMs would need at least 3 public IPs specified. Each element of this collection is of the form: /subscriptions/{subscription}/resourceGroups/{group}/providers/Microsoft.Network/publicIPAddresses/{ip}.")
  ipAddressIds?: Azure.Core.armResourceIdentifier[];
}

@doc("""
  Batch will retry Tasks when a recovery operation is triggered on a Node.
  Examples of recovery operations include (but are not limited to) when an
  unhealthy Node is rebooted or a Compute Node disappeared due to host failure.
  Retries due to recovery operations are independent of and are not counted
  against the maxTaskRetryCount. Even if the maxTaskRetryCount is 0, an internal
  retry due to a recovery operation may occur. Because of this, all Tasks should
  be idempotent. This means Tasks need to tolerate being interrupted and
  restarted without causing any corruption or duplicate data. The best practice
  for long running Tasks is to use some form of checkpointing. In some cases the
  StartTask may be re-run even though the Compute Node was not rebooted. Special
  care should be taken to avoid StartTasks which create breakaway process or
  install/launch services from the StartTask working directory, as this will
  block Batch from being able to re-run the StartTask.
  """)
model BatchStartTask {
  @doc("The command line of the StartTask. The command line does not run under a shell, and therefore cannot take advantage of shell features such as environment variable expansion. If you want to take advantage of such features, you should invoke the shell in the command line, for example using \"cmd /c MyCommand\" in Windows or \"/bin/sh -c MyCommand\" in Linux. If the command line refers to file paths, it should use a relative path (relative to the Task working directory), or use the Batch provided environment variable (https://learn.microsoft.com/azure/batch/batch-compute-node-environment-variables).")
  commandLine: string;

  @doc("The settings for the container under which the StartTask runs. When this is specified, all directories recursively below the AZ_BATCH_NODE_ROOT_DIR (the root of Azure Batch directories on the node) are mapped into the container, all Task environment variables are mapped into the container, and the Task command line is executed in the container. Files produced in the container outside of AZ_BATCH_NODE_ROOT_DIR might not be reflected to the host disk, meaning that Batch file APIs will not be able to access those files.")
  containerSettings?: BatchTaskContainerSettings;

  @doc("A list of files that the Batch service will download to the Compute Node before running the command line.  There is a maximum size for the list of resource files. When the max size is exceeded, the request will fail and the response error code will be RequestEntityTooLarge. If this occurs, the collection of ResourceFiles must be reduced in size. This can be achieved using .zip files, Application Packages, or Docker Containers. Files listed under this element are located in the Task's working directory.")
  resourceFiles?: ResourceFile[];

  @doc("A list of environment variable settings for the StartTask.")
  environmentSettings?: EnvironmentSetting[];

  @doc("The user identity under which the StartTask runs. If omitted, the Task runs as a non-administrative user unique to the Task.")
  userIdentity?: UserIdentity;

  @doc("The maximum number of times the Task may be retried. The Batch service retries a Task if its exit code is nonzero. Note that this value specifically controls the number of retries. The Batch service will try the Task once, and may then retry up to this limit. For example, if the maximum retry count is 3, Batch tries the Task up to 4 times (one initial try and 3 retries). If the maximum retry count is 0, the Batch service does not retry the Task. If the maximum retry count is -1, the Batch service retries the Task without limit, however this is not recommended for a start task or any task. The default value is 0 (no retries).")
  maxTaskRetryCount?: int32;

  @doc("Whether the Batch service should wait for the StartTask to complete successfully (that is, to exit with exit code 0) before scheduling any Tasks on the Compute Node. If true and the StartTask fails on a Node, the Batch service retries the StartTask up to its maximum retry count (maxTaskRetryCount). If the Task has still not completed successfully after all retries, then the Batch service marks the Node unusable, and will not schedule Tasks to it. This condition can be detected via the Compute Node state and failure info details. If false, the Batch service will not wait for the StartTask to complete. In this case, other Tasks can start executing on the Compute Node while the StartTask is still running; and even if the StartTask fails, new Tasks will continue to be scheduled on the Compute Node. The default is true.")
  waitForSuccess?: boolean;
}

@doc("A reference to a Certificate to be installed on Compute Nodes in a Pool. Warning: This object is deprecated and will be removed after February, 2024. Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead.")
model BatchCertificateReference {
  @doc("The thumbprint of the Certificate.")
  thumbprint: string;

  @doc("The algorithm with which the thumbprint is associated. This must be sha1.")
  thumbprintAlgorithm: string;

  @doc("The location of the Certificate store on the Compute Node into which to install the Certificate. The default value is currentuser. This property is applicable only for Pools configured with Windows Compute Nodes (that is, created with cloudServiceConfiguration, or with virtualMachineConfiguration using a Windows Image reference). For Linux Compute Nodes, the Certificates are stored in a directory inside the Task working directory and an environment variable AZ_BATCH_CERTIFICATES_DIR is supplied to the Task to query for this location. For Certificates with visibility of 'remoteUser', a 'certs' directory is created in the user's home directory (e.g., /home/{user-name}/certs) and Certificates are placed in that directory.")
  storeLocation?: BatchCertificateStoreLocation;

  @doc("The name of the Certificate store on the Compute Node into which to install the Certificate. This property is applicable only for Pools configured with Windows Compute Nodes (that is, created with cloudServiceConfiguration, or with virtualMachineConfiguration using a Windows Image reference). Common store names include: My, Root, CA, Trust, Disallowed, TrustedPeople, TrustedPublisher, AuthRoot, AddressBook, but any custom store name can also be used. The default value is My.")
  storeName?: string;

  @doc("Which user Accounts on the Compute Node should have access to the private data of the Certificate. You can specify more than one visibility in this collection. The default is all Accounts.")
  visibility?: BatchCertificateVisibility[];
}

@doc("""
  Properties used to create a user used to execute Tasks on an Azure Batch
  Compute Node.
  """)
model UserAccount {
  @doc("The name of the user Account. Names can contain any Unicode characters up to a maximum length of 20.")
  name: string;

  @secret
  @doc("The password for the user Account.")
  password: string;

  @doc("The elevation level of the user Account. The default value is nonAdmin.")
  elevationLevel?: ElevationLevel;

  @doc("The Linux-specific user configuration for the user Account. This property is ignored if specified on a Windows Pool. If not specified, the user is created with the default options.")
  linuxUserConfiguration?: LinuxUserConfiguration;

  @doc("The Windows-specific user configuration for the user Account. This property can only be specified if the user is on a Windows Pool. If not specified and on a Windows Pool, the user is created with the default options.")
  windowsUserConfiguration?: WindowsUserConfiguration;
}

@doc("Properties used to create a user Account on a Linux Compute Node.")
model LinuxUserConfiguration {
  @doc("The user ID of the user Account. The uid and gid properties must be specified together or not at all. If not specified the underlying operating system picks the uid.")
  uid?: int32;

  @doc("The group ID for the user Account. The uid and gid properties must be specified together or not at all. If not specified the underlying operating system picks the gid.")
  gid?: int32;

  @secret
  @doc("The SSH private key for the user Account. The private key must not be password protected. The private key is used to automatically configure asymmetric-key based authentication for SSH between Compute Nodes in a Linux Pool when the Pool's enableInterNodeCommunication property is true (it is ignored if enableInterNodeCommunication is false). It does this by placing the key pair into the user's .ssh directory. If not specified, password-less SSH is not configured between Compute Nodes (no modification of the user's .ssh directory is done).")
  sshPrivateKey?: string;
}

@doc("Properties used to create a user Account on a Windows Compute Node.")
model WindowsUserConfiguration {
  @doc("The login mode for the user. The default is 'batch'.")
  loginMode?: LoginMode;
}

@doc("The managed disk parameters.")
model ManagedDisk {
  @doc("The storage account type for managed disk.")
  storageAccountType?: StorageAccountType;

  @doc("Specifies the security profile settings for the managed disk.")
  securityProfile?: BatchVmDiskSecurityProfile;
}

@doc("""
  The Batch service does not assign any meaning to this metadata; it is solely
  for the use of user code.
  """)
model BatchMetadataItem {
  @doc("The name of the metadata item.")
  name: string;

  @doc("The value of the metadata item.")
  value: string;
}

@doc("The file system to mount on each node.")
model MountConfiguration {
  @doc("The Azure Storage Container to mount using blob FUSE on each node. This property is mutually exclusive with all other properties.")
  azureBlobFileSystemConfiguration?: AzureBlobFileSystemConfiguration;

  @doc("The NFS file system to mount on each node. This property is mutually exclusive with all other properties.")
  nfsMountConfiguration?: NfsMountConfiguration;

  @doc("The CIFS/SMB file system to mount on each node. This property is mutually exclusive with all other properties.")
  cifsMountConfiguration?: CifsMountConfiguration;

  @doc("The Azure File Share to mount on each node. This property is mutually exclusive with all other properties.")
  azureFileShareConfiguration?: AzureFileShareConfiguration;
}

@doc("Information used to connect to an Azure Storage Container using Blobfuse.")
model AzureBlobFileSystemConfiguration {
  @doc("The Azure Storage Account name.")
  accountName: string;

  @doc("The Azure Blob Storage Container name.")
  containerName: string;

  @secret
  @doc("The Azure Storage Account key. This property is mutually exclusive with both sasKey and identity; exactly one must be specified.")
  accountKey?: string;

  @secret
  @doc("The Azure Storage SAS token. This property is mutually exclusive with both accountKey and identity; exactly one must be specified.")
  sasKey?: string;

  @doc("Additional command line options to pass to the mount command. These are 'net use' options in Windows and 'mount' options in Linux.")
  blobfuseOptions?: string;

  @doc("The relative path on the compute node where the file system will be mounted. All file systems are mounted relative to the Batch mounts directory, accessible via the AZ_BATCH_NODE_MOUNTS_DIR environment variable.")
  relativeMountPath: string;

  @doc("The reference to the user assigned identity to use to access containerName. This property is mutually exclusive with both accountKey and sasKey; exactly one must be specified.")
  identityReference?: BatchNodeIdentityReference;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("Information used to connect to an NFS file system.")
model NfsMountConfiguration {
  @doc("The URI of the file system to mount.")
  source: string;

  @doc("The relative path on the compute node where the file system will be mounted. All file systems are mounted relative to the Batch mounts directory, accessible via the AZ_BATCH_NODE_MOUNTS_DIR environment variable.")
  relativeMountPath: string;

  @doc("Additional command line options to pass to the mount command. These are 'net use' options in Windows and 'mount' options in Linux.")
  mountOptions?: string;
}

@doc("Information used to connect to a CIFS file system.")
model CifsMountConfiguration {
  @doc("The user to use for authentication against the CIFS file system.")
  username: string;

  @doc("The URI of the file system to mount.")
  source: string;

  @doc("The relative path on the compute node where the file system will be mounted. All file systems are mounted relative to the Batch mounts directory, accessible via the AZ_BATCH_NODE_MOUNTS_DIR environment variable.")
  relativeMountPath: string;

  @doc("Additional command line options to pass to the mount command. These are 'net use' options in Windows and 'mount' options in Linux.")
  mountOptions?: string;

  @secret
  @doc("The password to use for authentication against the CIFS file system.")
  password: string;
}

@doc("Information used to connect to an Azure Fileshare.")
model AzureFileShareConfiguration {
  @doc("The Azure Storage account name.")
  accountName: string;

  @secret
  @doc("The Azure Storage account key.")
  accountKey: string;

  @doc("The Azure Files URL. This is of the form 'https://{account}.file.core.windows.net/'.")
  @clientName("azureFileUri", "csharp")
  azureFileUrl: url;

  @doc("The relative path on the compute node where the file system will be mounted. All file systems are mounted relative to the Batch mounts directory, accessible via the AZ_BATCH_NODE_MOUNTS_DIR environment variable.")
  relativeMountPath: string;

  @doc("Additional command line options to pass to the mount command. These are 'net use' options in Windows and 'mount' options in Linux.")
  mountOptions?: string;
}

@doc("""
  Contains information about Jobs that have been and will be run under a Job
  Schedule.
  """)
model BatchJobScheduleExecutionInfo {
  @doc("The next time at which a Job will be created under this schedule. This property is meaningful only if the schedule is in the active state when the time comes around. For example, if the schedule is disabled, no Job will be created at nextRunTime unless the Job is enabled before then.")
  nextRunTime?: utcDateTime;

  @doc("Information about the most recent Job under the Job Schedule. This property is present only if the at least one Job has run under the schedule.")
  recentJob?: RecentBatchJob;

  @doc("The time at which the schedule ended. This property is set only if the Job Schedule is in the completed state.")
  endTime?: utcDateTime;
}

@doc("Information about the most recent Job to run under the Job Schedule.")
model RecentBatchJob {
  @doc("The ID of the Job.")
  id?: string;

  @doc("The URL of the Job.")
  @clientName("uri", "csharp")
  url?: url;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("Resource usage statistics for a Job Schedule.")
model BatchJobScheduleStatistics {
  @doc("The URL of the statistics.")
  @clientName("uri", "csharp")
  url: url;

  @doc("The start time of the time range covered by the statistics.")
  startTime: utcDateTime;

  @doc("The time at which the statistics were last updated. All statistics are limited to the range between startTime and lastUpdateTime.")
  lastUpdateTime: utcDateTime;

  @doc("The total user mode CPU time (summed across all cores and all Compute Nodes) consumed by all Tasks in all Jobs created under the schedule.")
  @clientName("userCpuTime", "!go")
  userCPUTime: duration;

  @doc("The total kernel mode CPU time (summed across all cores and all Compute Nodes) consumed by all Tasks in all Jobs created under the schedule.")
  @clientName("kernelCpuTime", "!go")
  kernelCPUTime: duration;

  @doc("The total wall clock time of all the Tasks in all the Jobs created under the schedule. The wall clock time is the elapsed time from when the Task started running on a Compute Node to when it finished (or to the last time the statistics were updated, if the Task had not finished by then). If a Task was retried, this includes the wall clock time of all the Task retries.")
  wallClockTime: duration;

  @doc("The total number of disk read operations made by all Tasks in all Jobs created under the schedule.")
  @encode(string)
  @clientName("readIops")
  readIOps: int64;

  @doc("The total number of disk write operations made by all Tasks in all Jobs created under the schedule.")
  @encode(string)
  @clientName("writeIops")
  writeIOps: int64;

  @doc("The total gibibytes read from disk by all Tasks in all Jobs created under the schedule.")
  @clientName("readIoGiB")
  readIOGiB: float32;

  @doc("The total gibibytes written to disk by all Tasks in all Jobs created under the schedule.")
  @clientName("writeIoGiB")
  writeIOGiB: float32;

  @doc("The total number of Tasks successfully completed during the given time range in Jobs created under the schedule. A Task completes successfully if it returns exit code 0.")
  @encode(string)
  @clientName("succeededTasksCount")
  numSucceededTasks: int64;

  @doc("The total number of Tasks that failed during the given time range in Jobs created under the schedule. A Task fails if it exhausts its maximum retry count without returning exit code 0.")
  @encode(string)
  @clientName("failedTasksCount")
  numFailedTasks: int64;

  @doc("The total number of retries during the given time range on all Tasks in all Jobs created under the schedule.")
  @encode(string)
  @clientName("taskRetriesCount")
  numTaskRetries: int64;

  @doc("The total wait time of all Tasks in all Jobs created under the schedule. The wait time for a Task is defined as the elapsed time between the creation of the Task and the start of Task execution. (If the Task is retried due to failures, the wait time is the time to the most recent Task execution.). This value is only reported in the Account lifetime statistics; it is not included in the Job statistics.")
  waitTime: duration;
}

@doc("The result of listing the Job Schedules in an Account.")
model BatchJobScheduleListResult {
  @doc("The list of Job Schedules.")
  @pageItems
  value?: BatchJobSchedule[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("An Azure Batch Job.")
model BatchJob {
  @doc("A string that uniquely identifies the Job within the Account. The ID is case-preserving and case-insensitive (that is, you may not have two IDs within an Account that differ only by case).")
  @visibility(Lifecycle.Read)
  id?: string;

  @doc("The display name for the Job.")
  @visibility(Lifecycle.Read)
  displayName?: string;

  @doc("Whether Tasks in the Job can define dependencies on each other. The default is false.")
  @visibility(Lifecycle.Read)
  usesTaskDependencies?: boolean;

  @doc("The URL of the Job.")
  @visibility(Lifecycle.Read)
  @clientName("uri", "csharp")
  url?: url;

  @doc("The ETag of the Job. This is an opaque string. You can use it to detect whether the Job has changed between requests. In particular, you can be pass the ETag when updating a Job to specify that your changes should take effect only if nobody else has modified the Job in the meantime.")
  @visibility(Lifecycle.Read)
  eTag?: eTag;

  @doc("The last modified time of the Job. This is the last time at which the Job level data, such as the Job state or priority, changed. It does not factor in task-level changes such as adding new Tasks or Tasks changing state.")
  @visibility(Lifecycle.Read)
  lastModified?: utcDateTime;

  @doc("The creation time of the Job.")
  @visibility(Lifecycle.Read)
  creationTime?: utcDateTime;

  @doc("The current state of the Job.")
  @visibility(Lifecycle.Read)
  state?: BatchJobState;

  @doc("The time at which the Job entered its current state.")
  @visibility(Lifecycle.Read)
  stateTransitionTime?: utcDateTime;

  @doc("The previous state of the Job. This property is not set if the Job is in its initial Active state.")
  @visibility(Lifecycle.Read)
  previousState?: BatchJobState;

  @doc("The time at which the Job entered its previous state. This property is not set if the Job is in its initial Active state.")
  @visibility(Lifecycle.Read)
  previousStateTransitionTime?: utcDateTime;

  @doc("The priority of the Job. Priority values can range from -1000 to 1000, with -1000 being the lowest priority and 1000 being the highest priority. The default value is 0.")
  priority?: int32;

  @doc("Whether Tasks in this job can be preempted by other high priority jobs. If the value is set to True, other high priority jobs submitted to the system will take precedence and will be able requeue tasks from this job. You can update a job's allowTaskPreemption after it has been created using the update job API.")
  allowTaskPreemption?: boolean;

  @doc("The maximum number of tasks that can be executed in parallel for the job. The value of maxParallelTasks must be -1 or greater than 0 if specified. If not specified, the default value is -1, which means there's no limit to the number of tasks that can be run at once. You can update a job's maxParallelTasks after it has been created using the update job API.")
  maxParallelTasks?: int32 = -1;

  @doc("The execution constraints for the Job.")
  constraints?: BatchJobConstraints;

  @doc("Details of a Job Manager Task to be launched when the Job is started.")
  @visibility(Lifecycle.Read)
  jobManagerTask?: BatchJobManagerTask;

  @doc("The Job Preparation Task. The Job Preparation Task is a special Task run on each Compute Node before any other Task of the Job.")
  @visibility(Lifecycle.Read)
  jobPreparationTask?: BatchJobPreparationTask;

  @doc("The Job Release Task. The Job Release Task is a special Task run at the end of the Job on each Compute Node that has run any other Task of the Job.")
  @visibility(Lifecycle.Read)
  jobReleaseTask?: BatchJobReleaseTask;

  @doc("The list of common environment variable settings. These environment variables are set for all Tasks in the Job (including the Job Manager, Job Preparation and Job Release Tasks). Individual Tasks can override an environment setting specified here by specifying the same setting name with a different value.")
  @visibility(Lifecycle.Read)
  commonEnvironmentSettings?: EnvironmentSetting[];

  @doc("The Pool settings associated with the Job.")
  poolInfo: BatchPoolInfo;

  @doc("The action the Batch service should take when all Tasks in the Job are in the completed state. The default is noaction.")
  @clientName("allTasksCompleteMode")
  onAllTasksComplete?: BatchAllTasksCompleteMode;

  @doc("The action the Batch service should take when any Task in the Job fails. A Task is considered to have failed if has a failureInfo. A failureInfo is set if the Task completes with a non-zero exit code after exhausting its retry count, or if there was an error starting the Task, for example due to a resource file download error. The default is noaction.")
  @visibility(Lifecycle.Read)
  @clientName("taskFailureMode")
  onTaskFailure?: BatchTaskFailureMode;

  @doc("The network configuration for the Job.")
  @visibility(Lifecycle.Read)
  networkConfiguration?: BatchJobNetworkConfiguration;

  @doc("A list of name-value pairs associated with the Job as metadata. The Batch service does not assign any meaning to metadata; it is solely for the use of user code.")
  metadata?: BatchMetadataItem[];

  @doc("The execution information for the Job.")
  @visibility(Lifecycle.Read)
  executionInfo?: BatchJobExecutionInfo;

  @doc("Resource usage statistics for the entire lifetime of the Job. This property is populated only if the BatchJob was retrieved with an expand clause including the 'stats' attribute; otherwise it is null. The statistics may not be immediately available. The Batch service performs periodic roll-up of statistics. The typical delay is about 30 minutes.")
  @visibility(Lifecycle.Read)
  @clientName("jobStatistics")
  stats?: BatchJobStatistics;
}

@doc("Parameters for creating an Azure Batch Job.")
model BatchJobCreateOptions {
  @doc("A string that uniquely identifies the Job within the Account. The ID can contain any combination of alphanumeric characters including hyphens and underscores, and cannot contain more than 64 characters. The ID is case-preserving and case-insensitive (that is, you may not have two IDs within an Account that differ only by case).")
  id: string;

  @doc("The display name for the Job. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  displayName?: string;

  @doc("Whether Tasks in the Job can define dependencies on each other. The default is false.")
  usesTaskDependencies?: boolean;

  @doc("The priority of the Job. Priority values can range from -1000 to 1000, with -1000 being the lowest priority and 1000 being the highest priority. The default value is 0.")
  priority?: int32;

  @doc("Whether Tasks in this job can be preempted by other high priority jobs. If the value is set to True, other high priority jobs submitted to the system will take precedence and will be able requeue tasks from this job. You can update a job's allowTaskPreemption after it has been created using the update job API.")
  allowTaskPreemption?: boolean;

  @doc("The maximum number of tasks that can be executed in parallel for the job. The value of maxParallelTasks must be -1 or greater than 0 if specified. If not specified, the default value is -1, which means there's no limit to the number of tasks that can be run at once. You can update a job's maxParallelTasks after it has been created using the update job API.")
  maxParallelTasks?: int32 = -1;

  @doc("The execution constraints for the Job.")
  constraints?: BatchJobConstraints;

  @doc("Details of a Job Manager Task to be launched when the Job is started. If the Job does not specify a Job Manager Task, the user must explicitly add Tasks to the Job. If the Job does specify a Job Manager Task, the Batch service creates the Job Manager Task when the Job is created, and will try to schedule the Job Manager Task before scheduling other Tasks in the Job. The Job Manager Task's typical purpose is to control and/or monitor Job execution, for example by deciding what additional Tasks to run, determining when the work is complete, etc. (However, a Job Manager Task is not restricted to these activities - it is a fully-fledged Task in the system and perform whatever actions are required for the Job.) For example, a Job Manager Task might download a file specified as a parameter, analyze the contents of that file and submit additional Tasks based on those contents.")
  jobManagerTask?: BatchJobManagerTask;

  @doc("The Job Preparation Task. If a Job has a Job Preparation Task, the Batch service will run the Job Preparation Task on a Node before starting any Tasks of that Job on that Compute Node.")
  jobPreparationTask?: BatchJobPreparationTask;

  @doc("The Job Release Task. A Job Release Task cannot be specified without also specifying a Job Preparation Task for the Job. The Batch service runs the Job Release Task on the Nodes that have run the Job Preparation Task. The primary purpose of the Job Release Task is to undo changes to Compute Nodes made by the Job Preparation Task. Example activities include deleting local files, or shutting down services that were started as part of Job preparation.")
  jobReleaseTask?: BatchJobReleaseTask;

  @doc("The list of common environment variable settings. These environment variables are set for all Tasks in the Job (including the Job Manager, Job Preparation and Job Release Tasks). Individual Tasks can override an environment setting specified here by specifying the same setting name with a different value.")
  commonEnvironmentSettings?: EnvironmentSetting[];

  @doc("The Pool on which the Batch service runs the Job's Tasks.")
  poolInfo: BatchPoolInfo;

  @doc("The action the Batch service should take when all Tasks in the Job are in the completed state. Note that if a Job contains no Tasks, then all Tasks are considered complete. This option is therefore most commonly used with a Job Manager task; if you want to use automatic Job termination without a Job Manager, you should initially set onAllTasksComplete to noaction and update the Job properties to set onAllTasksComplete to terminatejob once you have finished adding Tasks. The default is noaction.")
  @clientName("allTasksCompleteMode")
  onAllTasksComplete?: BatchAllTasksCompleteMode;

  @doc("The action the Batch service should take when any Task in the Job fails. A Task is considered to have failed if has a failureInfo. A failureInfo is set if the Task completes with a non-zero exit code after exhausting its retry count, or if there was an error starting the Task, for example due to a resource file download error. The default is noaction.")
  @clientName("taskFailureMode")
  onTaskFailure?: BatchTaskFailureMode;

  @doc("The network configuration for the Job.")
  networkConfiguration?: BatchJobNetworkConfiguration;

  @doc("A list of name-value pairs associated with the Job as metadata. The Batch service does not assign any meaning to metadata; it is solely for the use of user code.")
  metadata?: BatchMetadataItem[];
}

@doc("Parameters for updating an Azure Batch Job.")
model BatchJobUpdateOptions {
  @doc("The priority of the Job. Priority values can range from -1000 to 1000, with -1000 being the lowest priority and 1000 being the highest priority. If omitted, the priority of the Job is left unchanged.")
  priority?: int32;

  @doc("Whether Tasks in this job can be preempted by other high priority jobs. If the value is set to True, other high priority jobs submitted to the system will take precedence and will be able requeue tasks from this job. You can update a job's allowTaskPreemption after it has been created using the update job API.")
  allowTaskPreemption?: boolean;

  @doc("The maximum number of tasks that can be executed in parallel for the job. The value of maxParallelTasks must be -1 or greater than 0 if specified. If not specified, the default value is -1, which means there's no limit to the number of tasks that can be run at once. You can update a job's maxParallelTasks after it has been created using the update job API.")
  maxParallelTasks?: int32;

  @doc("The execution constraints for the Job. If omitted, the existing execution constraints are left unchanged.")
  constraints?: BatchJobConstraints;

  @doc("The Pool on which the Batch service runs the Job's Tasks. You may change the Pool for a Job only when the Job is disabled. The Patch Job call will fail if you include the poolInfo element and the Job is not disabled. If you specify an autoPoolSpecification in the poolInfo, only the keepAlive property of the autoPoolSpecification can be updated, and then only if the autoPoolSpecification has a poolLifetimeOption of Job (other job properties can be updated as normal). If omitted, the Job continues to run on its current Pool.")
  poolInfo?: BatchPoolInfo;

  @doc("The action the Batch service should take when all Tasks in the Job are in the completed state. If omitted, the completion behavior is left unchanged. You may not change the value from terminatejob to noaction - that is, once you have engaged automatic Job termination, you cannot turn it off again. If you try to do this, the request fails with an 'invalid property value' error response; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  @clientName("allTasksCompleteMode")
  onAllTasksComplete?: BatchAllTasksCompleteMode;

  @doc("A list of name-value pairs associated with the Job as metadata. If omitted, the existing Job metadata is left unchanged.")
  metadata?: BatchMetadataItem[];

  @doc("The network configuration for the Job.")
  networkConfiguration?: BatchJobNetworkConfiguration;
}

@doc("Contains information about the execution of a Job in the Azure Batch service.")
model BatchJobExecutionInfo {
  @doc("The start time of the Job. This is the time at which the Job was created.")
  startTime: utcDateTime;

  @doc("The completion time of the Job. This property is set only if the Job is in the completed state.")
  endTime?: utcDateTime;

  @doc("The ID of the Pool to which this Job is assigned. This element contains the actual Pool where the Job is assigned. When you get Job details from the service, they also contain a poolInfo element, which contains the Pool configuration data from when the Job was added or updated. That poolInfo element may also contain a poolId element. If it does, the two IDs are the same. If it does not, it means the Job ran on an auto Pool, and this property contains the ID of that auto Pool.")
  poolId?: string;

  @doc("Details of any error encountered by the service in starting the Job. This property is not set if there was no error starting the Job.")
  schedulingError?: BatchJobSchedulingError;

  @doc("A string describing the reason the Job ended. This property is set only if the Job is in the completed state. If the Batch service terminates the Job, it sets the reason as follows: JMComplete - the Job Manager Task completed, and killJobOnCompletion was set to true. MaxWallClockTimeExpiry - the Job reached its maxWallClockTime constraint. TerminateJobSchedule - the Job ran as part of a schedule, and the schedule terminated. AllTasksComplete - the Job's onAllTasksComplete attribute is set to terminatejob, and all Tasks in the Job are complete. TaskFailed - the Job's onTaskFailure attribute is set to performExitOptionsJobAction, and a Task in the Job failed with an exit condition that specified a jobAction of terminatejob. Any other string is a user-defined reason specified in a call to the 'Terminate a Job' operation.")
  @clientName("terminationReason")
  terminateReason?: string;
}

@doc("An error encountered by the Batch service when scheduling a Job.")
model BatchJobSchedulingError {
  @doc("The category of the Job scheduling error.")
  category: BatchErrorSourceCategory;

  @doc("An identifier for the Job scheduling error. Codes are invariant and are intended to be consumed programmatically.")
  code?: string;

  @doc("A message describing the Job scheduling error, intended to be suitable for display in a user interface.")
  message?: string;

  @doc("A list of additional error details related to the scheduling error.")
  details?: NameValuePair[];
}

@doc("Parameters for disabling an Azure Batch Job.")
model BatchJobDisableOptions {
  @doc("What to do with active Tasks associated with the Job.")
  disableTasks: DisableBatchJobOption;
}

@doc("Parameters for terminating an Azure Batch Job.")
model BatchJobTerminateOptions {
  @doc("The text you want to appear as the Job's TerminationReason. The default is 'UserTerminate'.")
  @clientName("terminationReason")
  terminateReason?: string;
}

@doc("The result of listing the Jobs in an Account.")
model BatchJobListResult {
  @doc("The list of Jobs.")
  @pageItems
  value?: BatchJob[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("""
  The result of listing the status of the Job Preparation and Job Release Tasks
  for a Job.
  """)
model BatchJobPreparationAndReleaseTaskStatusListResult {
  @doc("A list of Job Preparation and Job Release Task execution information.")
  @pageItems
  value?: BatchJobPreparationAndReleaseTaskStatus[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("The status of the Job Preparation and Job Release Tasks on a Compute Node.")
model BatchJobPreparationAndReleaseTaskStatus {
  @doc("The ID of the Pool containing the Compute Node to which this entry refers.")
  poolId?: string;

  @doc("The ID of the Compute Node to which this entry refers.")
  nodeId?: string;

  @doc("The URL of the Compute Node to which this entry refers.")
  @clientName("nodeUri", "csharp")
  nodeUrl?: url;

  @doc("Information about the execution status of the Job Preparation Task on this Compute Node.")
  jobPreparationTaskExecutionInfo?: BatchJobPreparationTaskExecutionInfo;

  @doc("Information about the execution status of the Job Release Task on this Compute Node. This property is set only if the Job Release Task has run on the Compute Node.")
  jobReleaseTaskExecutionInfo?: BatchJobReleaseTaskExecutionInfo;
}

@doc("""
  Contains information about the execution of a Job Preparation Task on a Compute
  Node.
  """)
model BatchJobPreparationTaskExecutionInfo {
  @doc("The time at which the Task started running. If the Task has been restarted or retried, this is the most recent time at which the Task started running.")
  startTime: utcDateTime;

  @doc("The time at which the Job Preparation Task completed. This property is set only if the Task is in the Completed state.")
  endTime?: utcDateTime;

  @doc("The current state of the Job Preparation Task on the Compute Node.")
  state: BatchJobPreparationTaskState;

  @doc("The root directory of the Job Preparation Task on the Compute Node. You can use this path to retrieve files created by the Task, such as log files.")
  taskRootDirectory?: string;

  @doc("The URL to the root directory of the Job Preparation Task on the Compute Node.")
  @clientName("taskRootDirectoryUri", "csharp")
  taskRootDirectoryUrl?: url;

  @doc("The exit code of the program specified on the Task command line. This parameter is returned only if the Task is in the completed state. The exit code for a process reflects the specific convention implemented by the application developer for that process. If you use the exit code value to make decisions in your code, be sure that you know the exit code convention used by the application process. Note that the exit code may also be generated by the Compute Node operating system, such as when a process is forcibly terminated.")
  exitCode?: int32;

  @doc("Information about the container under which the Task is executing. This property is set only if the Task runs in a container context.")
  containerInfo?: BatchTaskContainerExecutionInfo;

  @doc("Information describing the Task failure, if any. This property is set only if the Task is in the completed state and encountered a failure.")
  failureInfo?: BatchTaskFailureInfo;

  @doc("The number of times the Task has been retried by the Batch service. Task application failures (non-zero exit code) are retried, pre-processing errors (the Task could not be run) and file upload errors are not retried. The Batch service will retry the Task up to the limit specified by the constraints. Task application failures (non-zero exit code) are retried, pre-processing errors (the Task could not be run) and file upload errors are not retried. The Batch service will retry the Task up to the limit specified by the constraints.")
  retryCount: int32;

  @doc("The most recent time at which a retry of the Job Preparation Task started running. This property is set only if the Task was retried (i.e. retryCount is nonzero). If present, this is typically the same as startTime, but may be different if the Task has been restarted for reasons other than retry; for example, if the Compute Node was rebooted during a retry, then the startTime is updated but the lastRetryTime is not.")
  lastRetryTime?: utcDateTime;

  @doc("The result of the Task execution. If the value is 'failed', then the details of the failure can be found in the failureInfo property.")
  result?: BatchTaskExecutionResult;
}

@doc("Contains information about the container which a Task is executing.")
model BatchTaskContainerExecutionInfo {
  @doc("The ID of the container.")
  containerId?: string;

  @doc("The state of the container. This is the state of the container according to the Docker service. It is equivalent to the status field returned by \"docker inspect\".")
  state?: string;

  @doc("Detailed error information about the container. This is the detailed error string from the Docker service, if available. It is equivalent to the error field returned by \"docker inspect\".")
  error?: string;
}

@doc("Information about a Task failure.")
model BatchTaskFailureInfo {
  @doc("The category of the Task error.")
  category: BatchErrorSourceCategory;

  @doc("An identifier for the Task error. Codes are invariant and are intended to be consumed programmatically.")
  code?: string;

  @doc("A message describing the Task error, intended to be suitable for display in a user interface.")
  message?: string;

  @doc("A list of additional details related to the error.")
  details?: NameValuePair[];
}

@doc("""
  Contains information about the execution of a Job Release Task on a Compute
  Node.
  """)
model BatchJobReleaseTaskExecutionInfo {
  @doc("The time at which the Task started running. If the Task has been restarted or retried, this is the most recent time at which the Task started running.")
  startTime: utcDateTime;

  @doc("The time at which the Job Release Task completed. This property is set only if the Task is in the Completed state.")
  endTime?: utcDateTime;

  @doc("The current state of the Job Release Task on the Compute Node.")
  state: BatchJobReleaseTaskState;

  @doc("The root directory of the Job Release Task on the Compute Node. You can use this path to retrieve files created by the Task, such as log files.")
  taskRootDirectory?: string;

  @doc("The URL to the root directory of the Job Release Task on the Compute Node.")
  @clientName("taskRootDirectoryUri", "csharp")
  taskRootDirectoryUrl?: url;

  @doc("The exit code of the program specified on the Task command line. This parameter is returned only if the Task is in the completed state. The exit code for a process reflects the specific convention implemented by the application developer for that process. If you use the exit code value to make decisions in your code, be sure that you know the exit code convention used by the application process. Note that the exit code may also be generated by the Compute Node operating system, such as when a process is forcibly terminated.")
  exitCode?: int32;

  @doc("Information about the container under which the Task is executing. This property is set only if the Task runs in a container context.")
  containerInfo?: BatchTaskContainerExecutionInfo;

  @doc("Information describing the Task failure, if any. This property is set only if the Task is in the completed state and encountered a failure.")
  failureInfo?: BatchTaskFailureInfo;

  @doc("The result of the Task execution. If the value is 'failed', then the details of the failure can be found in the failureInfo property.")
  result?: BatchTaskExecutionResult;
}

@doc("The Task and TaskSlot counts for a Job.")
model BatchTaskCountsResult {
  @doc("The number of Tasks per state.")
  taskCounts: BatchTaskCounts;

  @doc("The number of TaskSlots required by Tasks per state.")
  taskSlotCounts: BatchTaskSlotCounts;
}

@doc("The Task counts for a Job.")
model BatchTaskCounts {
  @doc("The number of Tasks in the active state.")
  active: int32;

  @doc("The number of Tasks in the running or preparing state.")
  running: int32;

  @doc("The number of Tasks in the completed state.")
  completed: int32;

  @doc("The number of Tasks which succeeded. A Task succeeds if its result (found in the executionInfo property) is 'success'.")
  succeeded: int32;

  @doc("The number of Tasks which failed. A Task fails if its result (found in the executionInfo property) is 'failure'.")
  failed: int32;
}

@doc("The TaskSlot counts for a Job.")
model BatchTaskSlotCounts {
  @doc("The number of TaskSlots for active Tasks.")
  active: int32;

  @doc("The number of TaskSlots for running Tasks.")
  running: int32;

  @doc("The number of TaskSlots for completed Tasks.")
  completed: int32;

  @doc("The number of TaskSlots for succeeded Tasks.")
  succeeded: int32;

  @doc("The number of TaskSlots for failed Tasks.")
  failed: int32;
}

@doc("A Pool in the Azure Batch service.")
model BatchPool {
  @doc("A string that uniquely identifies the Pool within the Account. The ID can contain any combination of alphanumeric characters including hyphens and underscores, and cannot contain more than 64 characters. The ID is case-preserving and case-insensitive (that is, you may not have two IDs within an Account that differ only by case).")
  @visibility(Lifecycle.Read)
  id?: string;

  @doc("The display name for the Pool. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  @visibility(Lifecycle.Read)
  displayName?: string;

  @doc("The URL of the Pool.")
  @visibility(Lifecycle.Read)
  @clientName("uri", "csharp")
  url?: url;

  @doc("The ETag of the Pool. This is an opaque string. You can use it to detect whether the Pool has changed between requests. In particular, you can be pass the ETag when updating a Pool to specify that your changes should take effect only if nobody else has modified the Pool in the meantime.")
  @visibility(Lifecycle.Read)
  eTag?: eTag;

  @doc("The last modified time of the Pool. This is the last time at which the Pool level data, such as the targetDedicatedNodes or enableAutoscale settings, changed. It does not factor in node-level changes such as a Compute Node changing state.")
  @visibility(Lifecycle.Read)
  lastModified?: utcDateTime;

  @doc("The creation time of the Pool.")
  @visibility(Lifecycle.Read)
  creationTime?: utcDateTime;

  @doc("The current state of the Pool.")
  @visibility(Lifecycle.Read)
  state?: BatchPoolState;

  @doc("The time at which the Pool entered its current state.")
  @visibility(Lifecycle.Read)
  stateTransitionTime?: utcDateTime;

  @doc("Whether the Pool is resizing.")
  @visibility(Lifecycle.Read)
  allocationState?: AllocationState;

  @doc("The time at which the Pool entered its current allocation state.")
  @visibility(Lifecycle.Read)
  allocationStateTransitionTime?: utcDateTime;

  @doc("The size of virtual machines in the Pool. All virtual machines in a Pool are the same size. For information about available VM sizes, see Sizes for Virtual Machines in Azure (https://learn.microsoft.com/azure/virtual-machines/sizes/overview). Batch supports all Azure VM sizes except STANDARD_A0 and those with premium storage (STANDARD_GS, STANDARD_DS, and STANDARD_DSV2 series).")
  @visibility(Lifecycle.Read)
  vmSize?: string;

  @doc("The virtual machine configuration for the Pool. This property must be specified.")
  @visibility(Lifecycle.Read)
  virtualMachineConfiguration?: VirtualMachineConfiguration;

  @doc("The timeout for allocation of Compute Nodes to the Pool. This is the timeout for the most recent resize operation. (The initial sizing when the Pool is created counts as a resize.) The default value is 15 minutes.")
  @visibility(Lifecycle.Read)
  resizeTimeout?: duration;

  @doc("A list of errors encountered while performing the last resize on the Pool. This property is set only if one or more errors occurred during the last Pool resize, and only when the Pool allocationState is Steady.")
  @visibility(Lifecycle.Read)
  resizeErrors?: ResizeError[];

  @doc("The user-specified tags associated with the pool. The user-defined tags to be associated with the Azure Batch Pool. When specified, these tags are propagated to the backing Azure resources associated with the pool. This property can only be specified when the Batch account was created with the poolAllocationMode property set to 'UserSubscription'.")
  @visibility(Lifecycle.Read)
  resourceTags?: Record<string>;

  @doc("The number of dedicated Compute Nodes currently in the Pool.")
  @visibility(Lifecycle.Read)
  currentDedicatedNodes?: int32;

  @doc("The number of Spot/Low-priority Compute Nodes currently in the Pool. Spot/Low-priority Compute Nodes which have been preempted are included in this count.")
  @visibility(Lifecycle.Read)
  currentLowPriorityNodes?: int32;

  @doc("The desired number of dedicated Compute Nodes in the Pool.")
  @visibility(Lifecycle.Read)
  targetDedicatedNodes?: int32;

  @doc("The desired number of Spot/Low-priority Compute Nodes in the Pool.")
  @visibility(Lifecycle.Read)
  targetLowPriorityNodes?: int32;

  @doc("Whether the Pool size should automatically adjust over time. If false, at least one of targetDedicatedNodes and targetLowPriorityNodes must be specified. If true, the autoScaleFormula property is required and the Pool automatically resizes according to the formula. The default value is false.")
  @visibility(Lifecycle.Read)
  enableAutoScale?: boolean;

  @doc("A formula for the desired number of Compute Nodes in the Pool. This property is set only if the Pool automatically scales, i.e. enableAutoScale is true.")
  @visibility(Lifecycle.Read)
  autoScaleFormula?: string;

  @doc("The time interval at which to automatically adjust the Pool size according to the autoscale formula. This property is set only if the Pool automatically scales, i.e. enableAutoScale is true.")
  @visibility(Lifecycle.Read)
  autoScaleEvaluationInterval?: duration;

  @doc("The results and errors from the last execution of the autoscale formula. This property is set only if the Pool automatically scales, i.e. enableAutoScale is true.")
  @visibility(Lifecycle.Read)
  autoScaleRun?: AutoScaleRun;

  @doc("Whether the Pool permits direct communication between Compute Nodes. This imposes restrictions on which Compute Nodes can be assigned to the Pool. Specifying this value can reduce the chance of the requested number of Compute Nodes to be allocated in the Pool.")
  @visibility(Lifecycle.Read)
  enableInterNodeCommunication?: boolean;

  @doc("The network configuration for the Pool.")
  @visibility(Lifecycle.Read)
  networkConfiguration?: NetworkConfiguration;

  @doc("A Task specified to run on each Compute Node as it joins the Pool.")
  startTask?: BatchStartTask;

  @doc("""
    For Windows Nodes, the Batch service installs the Certificates to the specified Certificate store and location.
    For Linux Compute Nodes, the Certificates are stored in a directory inside the Task working directory and an environment variable AZ_BATCH_CERTIFICATES_DIR is supplied to the Task to query for this location.
    For Certificates with visibility of 'remoteUser', a 'certs' directory is created in the user's home directory (e.g., /home/{user-name}/certs) and Certificates are placed in that directory.
    Warning: This property is deprecated and will be removed after February, 2024. Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead.
    """)
  @visibility(Lifecycle.Read)
  certificateReferences?: BatchCertificateReference[];

  @doc("The list of Packages to be installed on each Compute Node in the Pool. Changes to Package references affect all new Nodes joining the Pool, but do not affect Compute Nodes that are already in the Pool until they are rebooted or reimaged. There is a maximum of 10 Package references on any given Pool.")
  @visibility(Lifecycle.Read)
  applicationPackageReferences?: BatchApplicationPackageReference[];

  @doc("The number of task slots that can be used to run concurrent tasks on a single compute node in the pool. The default value is 1. The maximum value is the smaller of 4 times the number of cores of the vmSize of the pool or 256.")
  @visibility(Lifecycle.Read)
  taskSlotsPerNode?: int32;

  @doc("How Tasks are distributed across Compute Nodes in a Pool. If not specified, the default is spread.")
  @visibility(Lifecycle.Read)
  taskSchedulingPolicy?: BatchTaskSchedulingPolicy;

  @doc("The list of user Accounts to be created on each Compute Node in the Pool.")
  @visibility(Lifecycle.Read)
  userAccounts?: UserAccount[];

  @doc("A list of name-value pairs associated with the Pool as metadata.")
  @visibility(Lifecycle.Read)
  metadata?: BatchMetadataItem[];

  @doc("Utilization and resource usage statistics for the entire lifetime of the Pool. This property is populated only if the BatchPool was retrieved with an expand clause including the 'stats' attribute; otherwise it is null. The statistics may not be immediately available. The Batch service performs periodic roll-up of statistics. The typical delay is about 30 minutes.")
  @visibility(Lifecycle.Read)
  @clientName("poolStatistics")
  stats?: BatchPoolStatistics;

  @doc("A list of file systems to mount on each node in the pool. This supports Azure Files, NFS, CIFS/SMB, and Blobfuse.")
  @visibility(Lifecycle.Read)
  mountConfiguration?: MountConfiguration[];

  @doc("The identity of the Batch pool, if configured. The list of user identities associated with the Batch pool. The user identity dictionary key references will be ARM resource ids in the form: '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identityName}'.")
  @visibility(Lifecycle.Read)
  identity?: BatchPoolIdentity;

  @doc("The desired node communication mode for the pool. If omitted, the default value is Default.")
  targetNodeCommunicationMode?: BatchNodeCommunicationMode;

  @doc("The current state of the pool communication mode.")
  @visibility(Lifecycle.Read)
  currentNodeCommunicationMode?: BatchNodeCommunicationMode;

  @doc("The upgrade policy for the Pool. Describes an upgrade policy - automatic, manual, or rolling.")
  upgradePolicy?: UpgradePolicy;
}

@doc("Parameters for creating an Azure Batch Pool.")
model BatchPoolCreateOptions {
  @doc("A string that uniquely identifies the Pool within the Account. The ID can contain any combination of alphanumeric characters including hyphens and underscores, and cannot contain more than 64 characters. The ID is case-preserving and case-insensitive (that is, you may not have two Pool IDs within an Account that differ only by case).")
  id: string;

  @doc("The display name for the Pool. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  displayName?: string;

  @doc("The size of virtual machines in the Pool. All virtual machines in a Pool are the same size. For information about available VM sizes for Pools using Images from the Virtual Machines Marketplace (pools created with virtualMachineConfiguration), see Sizes for Virtual Machines in Azure (https://learn.microsoft.com/azure/virtual-machines/sizes/overview). Batch supports all Azure VM sizes except STANDARD_A0 and those with premium storage (STANDARD_GS, STANDARD_DS, and STANDARD_DSV2 series).")
  vmSize: string;

  @doc("The virtual machine configuration for the Pool. This property must be specified.")
  virtualMachineConfiguration?: VirtualMachineConfiguration;

  @doc("The timeout for allocation of Compute Nodes to the Pool. This timeout applies only to manual scaling; it has no effect when enableAutoScale is set to true. The default value is 15 minutes. The minimum value is 5 minutes. If you specify a value less than 5 minutes, the Batch service returns an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  resizeTimeout?: duration;

  @doc("The user-specified tags associated with the pool. The user-defined tags to be associated with the Azure Batch Pool. When specified, these tags are propagated to the backing Azure resources associated with the pool. This property can only be specified when the Batch account was created with the poolAllocationMode property set to 'UserSubscription'.")
  resourceTags?: Record<string>;

  @doc("The desired number of dedicated Compute Nodes in the Pool. This property must not be specified if enableAutoScale is set to true. If enableAutoScale is set to false, then you must set either targetDedicatedNodes, targetLowPriorityNodes, or both.")
  targetDedicatedNodes?: int32;

  @doc("The desired number of Spot/Low-priority Compute Nodes in the Pool. This property must not be specified if enableAutoScale is set to true. If enableAutoScale is set to false, then you must set either targetDedicatedNodes, targetLowPriorityNodes, or both.")
  targetLowPriorityNodes?: int32;

  @doc("Whether the Pool size should automatically adjust over time. If false, at least one of targetDedicatedNodes and targetLowPriorityNodes must be specified. If true, the autoScaleFormula property is required and the Pool automatically resizes according to the formula. The default value is false.")
  enableAutoScale?: boolean;

  @doc("A formula for the desired number of Compute Nodes in the Pool. This property must not be specified if enableAutoScale is set to false. It is required if enableAutoScale is set to true. The formula is checked for validity before the Pool is created. If the formula is not valid, the Batch service rejects the request with detailed error information. For more information about specifying this formula, see 'Automatically scale Compute Nodes in an Azure Batch Pool' (https://learn.microsoft.com/azure/batch/batch-automatic-scaling).")
  autoScaleFormula?: string;

  @doc("The time interval at which to automatically adjust the Pool size according to the autoscale formula. The default value is 15 minutes. The minimum and maximum value are 5 minutes and 168 hours respectively. If you specify a value less than 5 minutes or greater than 168 hours, the Batch service returns an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  autoScaleEvaluationInterval?: duration;

  @doc("Whether the Pool permits direct communication between Compute Nodes. Enabling inter-node communication limits the maximum size of the Pool due to deployment restrictions on the Compute Nodes of the Pool. This may result in the Pool not reaching its desired size. The default value is false.")
  enableInterNodeCommunication?: boolean;

  @doc("The network configuration for the Pool.")
  networkConfiguration?: NetworkConfiguration;

  @doc("A Task specified to run on each Compute Node as it joins the Pool. The Task runs when the Compute Node is added to the Pool or when the Compute Node is restarted.")
  startTask?: BatchStartTask;

  @doc("""
    For Windows Nodes, the Batch service installs the Certificates to the specified Certificate store and location.
    For Linux Compute Nodes, the Certificates are stored in a directory inside the Task working directory and an environment variable AZ_BATCH_CERTIFICATES_DIR is supplied to the Task to query for this location.
    For Certificates with visibility of 'remoteUser', a 'certs' directory is created in the user's home directory (e.g., /home/{user-name}/certs) and Certificates are placed in that directory.
    Warning: This property is deprecated and will be removed after February, 2024. Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead.
    """)
  certificateReferences?: BatchCertificateReference[];

  @doc("The list of Packages to be installed on each Compute Node in the Pool. When creating a pool, the package's application ID must be fully qualified (/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Batch/batchAccounts/{accountName}/applications/{applicationName}). Changes to Package references affect all new Nodes joining the Pool, but do not affect Compute Nodes that are already in the Pool until they are rebooted or reimaged. There is a maximum of 10 Package references on any given Pool.")
  applicationPackageReferences?: BatchApplicationPackageReference[];

  @doc("The number of task slots that can be used to run concurrent tasks on a single compute node in the pool. The default value is 1. The maximum value is the smaller of 4 times the number of cores of the vmSize of the pool or 256.")
  taskSlotsPerNode?: int32;

  @doc("How Tasks are distributed across Compute Nodes in a Pool. If not specified, the default is spread.")
  taskSchedulingPolicy?: BatchTaskSchedulingPolicy;

  @doc("The list of user Accounts to be created on each Compute Node in the Pool.")
  userAccounts?: UserAccount[];

  @doc("A list of name-value pairs associated with the Pool as metadata. The Batch service does not assign any meaning to metadata; it is solely for the use of user code.")
  metadata?: BatchMetadataItem[];

  @doc("Mount storage using specified file system for the entire lifetime of the pool. Mount the storage using Azure fileshare, NFS, CIFS or Blobfuse based file system.")
  mountConfiguration?: MountConfiguration[];

  @doc("The desired node communication mode for the pool. If omitted, the default value is Default.")
  targetNodeCommunicationMode?: BatchNodeCommunicationMode;

  @doc("The upgrade policy for the Pool. Describes an upgrade policy - automatic, manual, or rolling.")
  upgradePolicy?: UpgradePolicy;
}

@doc("Parameters for replacing properties on an Azure Batch Pool.")
model BatchPoolReplaceOptions {
  @doc("A Task to run on each Compute Node as it joins the Pool. The Task runs when the Compute Node is added to the Pool or when the Compute Node is restarted. If this element is present, it overwrites any existing StartTask. If omitted, any existing StartTask is removed from the Pool.")
  startTask?: BatchStartTask;

  @doc("""
    This list replaces any existing Certificate references configured on the Pool.
    If you specify an empty collection, any existing Certificate references are removed from the Pool.
    For Windows Nodes, the Batch service installs the Certificates to the specified Certificate store and location.
    For Linux Compute Nodes, the Certificates are stored in a directory inside the Task working directory and an environment variable AZ_BATCH_CERTIFICATES_DIR is supplied to the Task to query for this location.
    For Certificates with visibility of 'remoteUser', a 'certs' directory is created in the user's home directory (e.g., /home/{user-name}/certs) and Certificates are placed in that directory.
    Warning: This property is deprecated and will be removed after February, 2024. Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead.
    """)
  certificateReferences: BatchCertificateReference[];

  @doc("The list of Application Packages to be installed on each Compute Node in the Pool. The list replaces any existing Application Package references on the Pool. Changes to Application Package references affect all new Compute Nodes joining the Pool, but do not affect Compute Nodes that are already in the Pool until they are rebooted or reimaged. There is a maximum of 10 Application Package references on any given Pool. If omitted, or if you specify an empty collection, any existing Application Packages references are removed from the Pool. A maximum of 10 references may be specified on a given Pool.")
  applicationPackageReferences: BatchApplicationPackageReference[];

  @doc("A list of name-value pairs associated with the Pool as metadata. This list replaces any existing metadata configured on the Pool. If omitted, or if you specify an empty collection, any existing metadata is removed from the Pool.")
  metadata: BatchMetadataItem[];

  @doc("The desired node communication mode for the pool. This setting replaces any existing targetNodeCommunication setting on the Pool. If omitted, the existing setting is default.")
  targetNodeCommunicationMode?: BatchNodeCommunicationMode;
}

@doc("Parameters for updating an Azure Batch Pool.")
model BatchPoolUpdateOptions {
  @doc("The display name for the Pool. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024. This field can be updated only when the pool is empty.")
  displayName?: string;

  @doc("The size of virtual machines in the Pool. For information about available sizes of virtual machines in Pools, see Choose a VM size for Compute Nodes in an Azure Batch Pool (https://learn.microsoft.com/azure/batch/batch-pool-vm-sizes).<br /><br />This field can be updated only when the pool is empty.")
  vmSize?: string;

  @doc("Whether the Pool permits direct communication between Compute Nodes. Enabling inter-node communication limits the maximum size of the Pool due to deployment restrictions on the Compute Nodes of the Pool. This may result in the Pool not reaching its desired size. The default value is false.<br /><br />This field can be updated only when the pool is empty.")
  enableInterNodeCommunication?: boolean;

  @doc("A Task to run on each Compute Node as it joins the Pool. The Task runs when the Compute Node is added to the Pool or when the Compute Node is restarted. If this element is present, it overwrites any existing StartTask. If omitted, any existing StartTask is left unchanged.")
  startTask?: BatchStartTask;

  @doc("""
    If this element is present, it replaces any existing Certificate references configured on the Pool.
    If omitted, any existing Certificate references are left unchanged.
    For Windows Nodes, the Batch service installs the Certificates to the specified Certificate store and location.
    For Linux Compute Nodes, the Certificates are stored in a directory inside the Task working directory and an environment variable AZ_BATCH_CERTIFICATES_DIR is supplied to the Task to query for this location.
    For Certificates with visibility of 'remoteUser', a 'certs' directory is created in the user's home directory (e.g., /home/{user-name}/certs) and Certificates are placed in that directory.
    Warning: This property is deprecated and will be removed after February, 2024. Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead.
    """)
  certificateReferences?: BatchCertificateReference[];

  @doc("A list of Packages to be installed on each Compute Node in the Pool. Changes to Package references affect all new Nodes joining the Pool, but do not affect Compute Nodes that are already in the Pool until they are rebooted or reimaged. If this element is present, it replaces any existing Package references. If you specify an empty collection, then all Package references are removed from the Pool. If omitted, any existing Package references are left unchanged.")
  applicationPackageReferences?: BatchApplicationPackageReference[];

  @doc("A list of name-value pairs associated with the Pool as metadata. If this element is present, it replaces any existing metadata configured on the Pool. If you specify an empty collection, any metadata is removed from the Pool. If omitted, any existing metadata is left unchanged.")
  metadata?: BatchMetadataItem[];

  @doc("The virtual machine configuration for the Pool. This property must be specified.<br /><br />This field can be updated only when the pool is empty.")
  virtualMachineConfiguration?: VirtualMachineConfiguration;

  @doc("The desired node communication mode for the pool. If this element is present, it replaces the existing targetNodeCommunicationMode configured on the Pool. If omitted, any existing metadata is left unchanged.")
  targetNodeCommunicationMode?: BatchNodeCommunicationMode;

  @doc("The number of task slots that can be used to run concurrent tasks on a single compute node in the pool. The default value is 1. The maximum value is the smaller of 4 times the number of cores of the vmSize of the pool or 256.<br /><br />This field can be updated only when the pool is empty.")
  taskSlotsPerNode?: int32;

  @doc("How Tasks are distributed across Compute Nodes in a Pool. If not specified, the default is spread.<br /><br />This field can be updated only when the pool is empty.")
  taskSchedulingPolicy?: BatchTaskSchedulingPolicy;

  @doc("The network configuration for the Pool. This field can be updated only when the pool is empty.")
  networkConfiguration?: NetworkConfiguration;

  @doc("The user-specified tags associated with the pool. The user-defined tags to be associated with the Azure Batch Pool. When specified, these tags are propagated to the backing Azure resources associated with the pool. This property can only be specified when the Batch account was created with the poolAllocationMode property set to 'UserSubscription'.<br /><br />This field can be updated only when the pool is empty.")
  resourceTags?: Record<string>;

  @doc("The list of user Accounts to be created on each Compute Node in the Pool. This field can be updated only when the pool is empty.")
  userAccounts?: UserAccount[];

  @doc("Mount storage using specified file system for the entire lifetime of the pool. Mount the storage using Azure fileshare, NFS, CIFS or Blobfuse based file system.<br /><br />This field can be updated only when the pool is empty.")
  mountConfiguration?: MountConfiguration[];

  @doc("The upgrade policy for the Pool. Describes an upgrade policy - automatic, manual, or rolling.<br /><br />This field can be updated only when the pool is empty.")
  upgradePolicy?: UpgradePolicy;
}

@doc("An error that occurred when resizing a Pool.")
model ResizeError {
  @doc("An identifier for the Pool resize error. Codes are invariant and are intended to be consumed programmatically.")
  code?: string;

  @doc("A message describing the Pool resize error, intended to be suitable for display in a user interface.")
  message?: string;

  @doc("A list of additional error details related to the Pool resize error.")
  values?: NameValuePair[];
}

@doc("The results and errors from an execution of a Pool autoscale formula.")
model AutoScaleRun {
  @doc("The time at which the autoscale formula was last evaluated.")
  timestamp: utcDateTime;

  @doc("The final values of all variables used in the evaluation of the autoscale formula. Each variable value is returned in the form $variable=value, and variables are separated by semicolons.")
  results?: string;

  @doc("Details of the error encountered evaluating the autoscale formula on the Pool, if the evaluation was unsuccessful.")
  error?: AutoScaleRunError;
}

@doc("An error that occurred when executing or evaluating a Pool autoscale formula.")
model AutoScaleRunError {
  @doc("An identifier for the autoscale error. Codes are invariant and are intended to be consumed programmatically.")
  code?: string;

  @doc("A message describing the autoscale error, intended to be suitable for display in a user interface.")
  message?: string;

  @doc("A list of additional error details related to the autoscale error.")
  values?: NameValuePair[];
}

@doc("The identity of the Batch pool, if configured.")
model BatchPoolIdentity {
  @doc("The identity of the Batch pool, if configured. The list of user identities associated with the Batch pool. The user identity dictionary key references will be ARM resource ids in the form: '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identityName}'.")
  type: BatchPoolIdentityType;

  @doc("The list of user identities associated with the Batch account. The user identity dictionary key references will be ARM resource ids in the form: '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identityName}'.")
  userAssignedIdentities?: BatchUserAssignedIdentity[];
}

@doc("The user assigned Identity")
model BatchUserAssignedIdentity {
  @doc("The ARM resource id of the user assigned identity.")
  resourceId: Azure.Core.armResourceIdentifier;

  @doc("The client id of the user assigned identity.")
  @visibility(Lifecycle.Read)
  clientId?: string;

  @doc("The principal id of the user assigned identity.")
  @visibility(Lifecycle.Read)
  principalId?: string;
}

@doc("The result of listing the Pools in an Account.")
model BatchPoolListResult {
  @doc("The list of Pools.")
  @pageItems
  value?: BatchPool[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("Parameters for enabling automatic scaling on an Azure Batch Pool.")
model BatchPoolEnableAutoScaleOptions {
  @doc("The formula for the desired number of Compute Nodes in the Pool. The default value is 15 minutes. The minimum and maximum value are 5 minutes and 168 hours respectively. If you specify a value less than 5 minutes or greater than 168 hours, the Batch service rejects the request with an invalid property value error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request). If you specify a new interval, then the existing autoscale evaluation schedule will be stopped and a new autoscale evaluation schedule will be started, with its starting time being the time when this request was issued.")
  autoScaleFormula?: string;

  @doc("The time interval at which to automatically adjust the Pool size according to the autoscale formula. The default value is 15 minutes. The minimum and maximum value are 5 minutes and 168 hours respectively. If you specify a value less than 5 minutes or greater than 168 hours, the Batch service rejects the request with an invalid property value error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request). If you specify a new interval, then the existing autoscale evaluation schedule will be stopped and a new autoscale evaluation schedule will be started, with its starting time being the time when this request was issued.")
  autoScaleEvaluationInterval?: duration;
}

@doc("Parameters for evaluating an automatic scaling formula on an Azure Batch Pool.")
model BatchPoolEvaluateAutoScaleOptions {
  @doc("The formula for the desired number of Compute Nodes in the Pool. The formula is validated and its results calculated, but it is not applied to the Pool. To apply the formula to the Pool, 'Enable automatic scaling on a Pool'. For more information about specifying this formula, see Automatically scale Compute Nodes in an Azure Batch Pool (https://learn.microsoft.com/azure/batch/batch-automatic-scaling).")
  autoScaleFormula: string;
}

@doc("Parameters for changing the size of an Azure Batch Pool.")
model BatchPoolResizeOptions {
  @doc("The desired number of dedicated Compute Nodes in the Pool.")
  targetDedicatedNodes?: int32;

  @doc("The desired number of Spot/Low-priority Compute Nodes in the Pool.")
  targetLowPriorityNodes?: int32;

  @doc("The timeout for allocation of Nodes to the Pool or removal of Compute Nodes from the Pool. The default value is 15 minutes. The minimum value is 5 minutes. If you specify a value less than 5 minutes, the Batch service returns an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  resizeTimeout?: duration;

  @doc("Determines what to do with a Compute Node and its running task(s) if the Pool size is decreasing. The default value is requeue.")
  nodeDeallocationOption?: BatchNodeDeallocationOption;
}

@doc("Parameters for removing nodes from an Azure Batch Pool.")
model BatchNodeRemoveOptions {
  @doc("A list containing the IDs of the Compute Nodes to be removed from the specified Pool. A maximum of 100 nodes may be removed per request.")
  @clientName("nodeIds")
  nodeList: string[];

  @doc("The timeout for removal of Compute Nodes to the Pool. The default value is 15 minutes. The minimum value is 5 minutes. If you specify a value less than 5 minutes, the Batch service returns an error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  resizeTimeout?: duration;

  @doc("Determines what to do with a Compute Node and its running task(s) after it has been selected for deallocation. The default value is requeue.")
  nodeDeallocationOption?: BatchNodeDeallocationOption;
}

@doc("Options for deallocating a Compute Node.")
model BatchNodeDeallocateOptions {
  @doc("When to deallocate the Compute Node and what to do with currently running Tasks. The default value is requeue.")
  nodeDeallocateOption?: BatchNodeDeallocateOption;
}

@doc("""
  Batch will retry Tasks when a recovery operation is triggered on a Node.
  Examples of recovery operations include (but are not limited to) when an
  unhealthy Node is rebooted or a Compute Node disappeared due to host failure.
  Retries due to recovery operations are independent of and are not counted
  against the maxTaskRetryCount. Even if the maxTaskRetryCount is 0, an internal
  retry due to a recovery operation may occur. Because of this, all Tasks should
  be idempotent. This means Tasks need to tolerate being interrupted and
  restarted without causing any corruption or duplicate data. The best practice
  for long running Tasks is to use some form of checkpointing.
  """)
model BatchTask {
  @doc("A string that uniquely identifies the Task within the Job. The ID can contain any combination of alphanumeric characters including hyphens and underscores, and cannot contain more than 64 characters.")
  @visibility(Lifecycle.Read)
  id?: string;

  @doc("A display name for the Task. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  @visibility(Lifecycle.Read)
  displayName?: string;

  @doc("The URL of the Task.")
  @visibility(Lifecycle.Read)
  @clientName("uri", "csharp")
  url?: url;

  @doc("The ETag of the Task. This is an opaque string. You can use it to detect whether the Task has changed between requests. In particular, you can be pass the ETag when updating a Task to specify that your changes should take effect only if nobody else has modified the Task in the meantime.")
  @visibility(Lifecycle.Read)
  eTag?: eTag;

  @doc("The last modified time of the Task.")
  @visibility(Lifecycle.Read)
  lastModified?: utcDateTime;

  @doc("The creation time of the Task.")
  @visibility(Lifecycle.Read)
  creationTime?: utcDateTime;

  @doc("How the Batch service should respond when the Task completes.")
  @visibility(Lifecycle.Read)
  exitConditions?: ExitConditions;

  @doc("The current state of the Task.")
  @visibility(Lifecycle.Read)
  state?: BatchTaskState;

  @doc("The time at which the Task entered its current state.")
  @visibility(Lifecycle.Read)
  stateTransitionTime?: utcDateTime;

  @doc("The previous state of the Task. This property is not set if the Task is in its initial Active state.")
  @visibility(Lifecycle.Read)
  previousState?: BatchTaskState;

  @doc("The time at which the Task entered its previous state. This property is not set if the Task is in its initial Active state.")
  @visibility(Lifecycle.Read)
  previousStateTransitionTime?: utcDateTime;

  @doc("The command line of the Task. For multi-instance Tasks, the command line is executed as the primary Task, after the primary Task and all subtasks have finished executing the coordination command line. The command line does not run under a shell, and therefore cannot take advantage of shell features such as environment variable expansion. If you want to take advantage of such features, you should invoke the shell in the command line, for example using \"cmd /c MyCommand\" in Windows or \"/bin/sh -c MyCommand\" in Linux. If the command line refers to file paths, it should use a relative path (relative to the Task working directory), or use the Batch provided environment variable (https://learn.microsoft.com/azure/batch/batch-compute-node-environment-variables).")
  @visibility(Lifecycle.Read)
  commandLine?: string;

  @doc("The settings for the container under which the Task runs. If the Pool that will run this Task has containerConfiguration set, this must be set as well. If the Pool that will run this Task doesn't have containerConfiguration set, this must not be set. When this is specified, all directories recursively below the AZ_BATCH_NODE_ROOT_DIR (the root of Azure Batch directories on the node) are mapped into the container, all Task environment variables are mapped into the container, and the Task command line is executed in the container. Files produced in the container outside of AZ_BATCH_NODE_ROOT_DIR might not be reflected to the host disk, meaning that Batch file APIs will not be able to access those files.")
  @visibility(Lifecycle.Read)
  containerSettings?: BatchTaskContainerSettings;

  @doc("A list of files that the Batch service will download to the Compute Node before running the command line. For multi-instance Tasks, the resource files will only be downloaded to the Compute Node on which the primary Task is executed. There is a maximum size for the list of resource files.  When the max size is exceeded, the request will fail and the response error code will be RequestEntityTooLarge. If this occurs, the collection of ResourceFiles must be reduced in size. This can be achieved using .zip files, Application Packages, or Docker Containers.")
  @visibility(Lifecycle.Read)
  resourceFiles?: ResourceFile[];

  @doc("A list of files that the Batch service will upload from the Compute Node after running the command line. For multi-instance Tasks, the files will only be uploaded from the Compute Node on which the primary Task is executed.")
  @visibility(Lifecycle.Read)
  outputFiles?: OutputFile[];

  @doc("A list of environment variable settings for the Task.")
  @visibility(Lifecycle.Read)
  environmentSettings?: EnvironmentSetting[];

  @doc("A locality hint that can be used by the Batch service to select a Compute Node on which to start the new Task.")
  @visibility(Lifecycle.Read)
  affinityInfo?: BatchAffinityInfo;

  @doc("The execution constraints that apply to this Task.")
  constraints?: BatchTaskConstraints;

  @doc("The number of scheduling slots that the Task requires to run. The default is 1. A Task can only be scheduled to run on a compute node if the node has enough free scheduling slots available. For multi-instance Tasks, this must be 1.")
  @visibility(Lifecycle.Read)
  requiredSlots?: int32;

  @doc("The user identity under which the Task runs. If omitted, the Task runs as a non-administrative user unique to the Task.")
  @visibility(Lifecycle.Read)
  userIdentity?: UserIdentity;

  @doc("Information about the execution of the Task.")
  @visibility(Lifecycle.Read)
  executionInfo?: BatchTaskExecutionInfo;

  @doc("Information about the Compute Node on which the Task ran.")
  @visibility(Lifecycle.Read)
  nodeInfo?: BatchNodeInfo;

  @doc("An object that indicates that the Task is a multi-instance Task, and contains information about how to run the multi-instance Task.")
  @visibility(Lifecycle.Read)
  multiInstanceSettings?: MultiInstanceSettings;

  @doc("Resource usage statistics for the Task.")
  @visibility(Lifecycle.Read)
  @clientName("taskStatistics")
  stats?: BatchTaskStatistics;

  @doc("The Tasks that this Task depends on. This Task will not be scheduled until all Tasks that it depends on have completed successfully. If any of those Tasks fail and exhaust their retry counts, this Task will never be scheduled.")
  @visibility(Lifecycle.Read)
  dependsOn?: BatchTaskDependencies;

  @doc("A list of Packages that the Batch service will deploy to the Compute Node before running the command line. Application packages are downloaded and deployed to a shared directory, not the Task working directory. Therefore, if a referenced package is already on the Node, and is up to date, then it is not re-downloaded; the existing copy on the Compute Node is used. If a referenced Package cannot be installed, for example because the package has been deleted or because download failed, the Task fails.")
  @visibility(Lifecycle.Read)
  applicationPackageReferences?: BatchApplicationPackageReference[];

  @doc("The settings for an authentication token that the Task can use to perform Batch service operations. If this property is set, the Batch service provides the Task with an authentication token which can be used to authenticate Batch service operations without requiring an Account access key. The token is provided via the AZ_BATCH_AUTHENTICATION_TOKEN environment variable. The operations that the Task can carry out using the token depend on the settings. For example, a Task can request Job permissions in order to add other Tasks to the Job, or check the status of the Job or of other Tasks under the Job.")
  @visibility(Lifecycle.Read)
  authenticationTokenSettings?: AuthenticationTokenSettings;
}

@doc("""
  Parameters for creating an Azure Batch Task.
  """)
model BatchTaskCreateOptions {
  @doc("A string that uniquely identifies the Task within the Job. The ID can contain any combination of alphanumeric characters including hyphens and underscores, and cannot contain more than 64 characters. The ID is case-preserving and case-insensitive (that is, you may not have two IDs within a Job that differ only by case).")
  id: string;

  @doc("A display name for the Task. The display name need not be unique and can contain any Unicode characters up to a maximum length of 1024.")
  displayName?: string;

  @doc("How the Batch service should respond when the Task completes.")
  exitConditions?: ExitConditions;

  @doc("The command line of the Task. For multi-instance Tasks, the command line is executed as the primary Task, after the primary Task and all subtasks have finished executing the coordination command line. The command line does not run under a shell, and therefore cannot take advantage of shell features such as environment variable expansion. If you want to take advantage of such features, you should invoke the shell in the command line, for example using \"cmd /c MyCommand\" in Windows or \"/bin/sh -c MyCommand\" in Linux. If the command line refers to file paths, it should use a relative path (relative to the Task working directory), or use the Batch provided environment variable (https://learn.microsoft.com/azure/batch/batch-compute-node-environment-variables).")
  commandLine: string;

  @doc("The settings for the container under which the Task runs. If the Pool that will run this Task has containerConfiguration set, this must be set as well. If the Pool that will run this Task doesn't have containerConfiguration set, this must not be set. When this is specified, all directories recursively below the AZ_BATCH_NODE_ROOT_DIR (the root of Azure Batch directories on the node) are mapped into the container, all Task environment variables are mapped into the container, and the Task command line is executed in the container. Files produced in the container outside of AZ_BATCH_NODE_ROOT_DIR might not be reflected to the host disk, meaning that Batch file APIs will not be able to access those files.")
  containerSettings?: BatchTaskContainerSettings;

  @doc("A list of files that the Batch service will download to the Compute Node before running the command line. For multi-instance Tasks, the resource files will only be downloaded to the Compute Node on which the primary Task is executed. There is a maximum size for the list of resource files.  When the max size is exceeded, the request will fail and the response error code will be RequestEntityTooLarge. If this occurs, the collection of ResourceFiles must be reduced in size. This can be achieved using .zip files, Application Packages, or Docker Containers.")
  resourceFiles?: ResourceFile[];

  @doc("A list of files that the Batch service will upload from the Compute Node after running the command line. For multi-instance Tasks, the files will only be uploaded from the Compute Node on which the primary Task is executed.")
  outputFiles?: OutputFile[];

  @doc("A list of environment variable settings for the Task.")
  environmentSettings?: EnvironmentSetting[];

  @doc("A locality hint that can be used by the Batch service to select a Compute Node on which to start the new Task.")
  affinityInfo?: BatchAffinityInfo;

  @doc("The execution constraints that apply to this Task. If you do not specify constraints, the maxTaskRetryCount is the maxTaskRetryCount specified for the Job, the maxWallClockTime is infinite, and the retentionTime is 7 days.")
  constraints?: BatchTaskConstraints;

  @doc("The number of scheduling slots that the Task required to run. The default is 1. A Task can only be scheduled to run on a compute node if the node has enough free scheduling slots available. For multi-instance Tasks, this must be 1.")
  requiredSlots?: int32;

  @doc("The user identity under which the Task runs. If omitted, the Task runs as a non-administrative user unique to the Task.")
  userIdentity?: UserIdentity;

  @doc("An object that indicates that the Task is a multi-instance Task, and contains information about how to run the multi-instance Task.")
  multiInstanceSettings?: MultiInstanceSettings;

  @doc("The Tasks that this Task depends on. This Task will not be scheduled until all Tasks that it depends on have completed successfully. If any of those Tasks fail and exhaust their retry counts, this Task will never be scheduled. If the Job does not have usesTaskDependencies set to true, and this element is present, the request fails with error code TaskDependenciesNotSpecifiedOnJob.")
  dependsOn?: BatchTaskDependencies;

  @doc("A list of Packages that the Batch service will deploy to the Compute Node before running the command line. Application packages are downloaded and deployed to a shared directory, not the Task working directory. Therefore, if a referenced package is already on the Node, and is up to date, then it is not re-downloaded; the existing copy on the Compute Node is used. If a referenced Package cannot be installed, for example because the package has been deleted or because download failed, the Task fails.")
  applicationPackageReferences?: BatchApplicationPackageReference[];

  @doc("The settings for an authentication token that the Task can use to perform Batch service operations. If this property is set, the Batch service provides the Task with an authentication token which can be used to authenticate Batch service operations without requiring an Account access key. The token is provided via the AZ_BATCH_AUTHENTICATION_TOKEN environment variable. The operations that the Task can carry out using the token depend on the settings. For example, a Task can request Job permissions in order to add other Tasks to the Job, or check the status of the Job or of other Tasks under the Job.")
  authenticationTokenSettings?: AuthenticationTokenSettings;
}

@doc("Specifies how the Batch service should respond when the Task completes.")
model ExitConditions {
  @doc("A list of individual Task exit codes and how the Batch service should respond to them.")
  exitCodes?: ExitCodeMapping[];

  @doc("A list of Task exit code ranges and how the Batch service should respond to them.")
  exitCodeRanges?: ExitCodeRangeMapping[];

  @doc("How the Batch service should respond if the Task fails to start due to an error.")
  preProcessingError?: ExitOptions;

  @doc("How the Batch service should respond if a file upload error occurs. If the Task exited with an exit code that was specified via exitCodes or exitCodeRanges, and then encountered a file upload error, then the action specified by the exit code takes precedence.")
  fileUploadError?: ExitOptions;

  @doc("How the Batch service should respond if the Task fails with an exit condition not covered by any of the other properties. This value is used if the Task exits with any nonzero exit code not listed in the exitCodes or exitCodeRanges collection, with a pre-processing error if the preProcessingError property is not present, or with a file upload error if the fileUploadError property is not present. If you want non-default behavior on exit code 0, you must list it explicitly using the exitCodes or exitCodeRanges collection.")
  default?: ExitOptions;
}

@doc("""
  How the Batch service should respond if a Task exits with a particular exit
  code.
  """)
model ExitCodeMapping {
  @doc("A process exit code.")
  code: int32;

  @doc("How the Batch service should respond if the Task exits with this exit code.")
  exitOptions: ExitOptions;
}

@doc("Specifies how the Batch service responds to a particular exit condition.")
model ExitOptions {
  @doc("An action to take on the Job containing the Task, if the Task completes with the given exit condition and the Job's onTaskFailed property is 'performExitOptionsJobAction'. The default is none for exit code 0 and terminate for all other exit conditions. If the Job's onTaskFailed property is noaction, then specifying this property returns an error and the add Task request fails with an invalid property value error; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  jobAction?: BatchJobActionKind;

  @doc("An action that the Batch service performs on Tasks that depend on this Task. Possible values are 'satisfy' (allowing dependent tasks to progress) and 'block' (dependent tasks continue to wait). Batch does not yet support cancellation of dependent tasks.")
  dependencyAction?: DependencyAction;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("Specifies the security profile settings for the managed disk. **Note**: It can only be set for Confidential VMs and required when using Confidential VMs.")
model BatchVmDiskSecurityProfile {
  @doc("Specifies the EncryptionType of the managed disk. It is set to VMGuestStateOnly for encryption of just the VMGuestState blob, and NonPersistedTPM for not persisting firmware state in the VMGuestState blob. **Note**: It can be set for only Confidential VMs and is required when using Confidential VMs.")
  securityEncryptionType?: SecurityEncryptionTypes;
}

@doc("""
  A range of exit codes and how the Batch service should respond to exit codes
  within that range.
  """)
model ExitCodeRangeMapping {
  @doc("The first exit code in the range.")
  start: int32;

  @doc("The last exit code in the range.")
  end: int32;

  @doc("How the Batch service should respond if the Task exits with an exit code in the range start to end (inclusive).")
  exitOptions: ExitOptions;
}

@doc("""
  A locality hint that can be used by the Batch service to select a Compute Node
  on which to start a Task.
  """)
model BatchAffinityInfo {
  @doc("An opaque string representing the location of a Compute Node or a Task that has run previously. You can pass the affinityId of a Node to indicate that this Task needs to run on that Compute Node. Note that this is just a soft affinity. If the target Compute Node is busy or unavailable at the time the Task is scheduled, then the Task will be scheduled elsewhere.")
  affinityId: string;
}

@doc("Information about the execution of a Task.")
model BatchTaskExecutionInfo {
  @doc("The time at which the Task started running. 'Running' corresponds to the running state, so if the Task specifies resource files or Packages, then the start time reflects the time at which the Task started downloading or deploying these. If the Task has been restarted or retried, this is the most recent time at which the Task started running. This property is present only for Tasks that are in the running or completed state.")
  startTime?: utcDateTime;

  @doc("The time at which the Task completed. This property is set only if the Task is in the Completed state.")
  endTime?: utcDateTime;

  @doc("The exit code of the program specified on the Task command line. This property is set only if the Task is in the completed state. In general, the exit code for a process reflects the specific convention implemented by the application developer for that process. If you use the exit code value to make decisions in your code, be sure that you know the exit code convention used by the application process. However, if the Batch service terminates the Task (due to timeout, or user termination via the API) you may see an operating system-defined exit code.")
  exitCode?: int32;

  @doc("Information about the container under which the Task is executing. This property is set only if the Task runs in a container context.")
  containerInfo?: BatchTaskContainerExecutionInfo;

  @doc("Information describing the Task failure, if any. This property is set only if the Task is in the completed state and encountered a failure.")
  failureInfo?: BatchTaskFailureInfo;

  @doc("The number of times the Task has been retried by the Batch service. Task application failures (non-zero exit code) are retried, pre-processing errors (the Task could not be run) and file upload errors are not retried. The Batch service will retry the Task up to the limit specified by the constraints.")
  retryCount: int32;

  @doc("The most recent time at which a retry of the Task started running. This element is present only if the Task was retried (i.e. retryCount is nonzero). If present, this is typically the same as startTime, but may be different if the Task has been restarted for reasons other than retry; for example, if the Compute Node was rebooted during a retry, then the startTime is updated but the lastRetryTime is not.")
  lastRetryTime?: utcDateTime;

  @doc("The number of times the Task has been requeued by the Batch service as the result of a user request. When the user removes Compute Nodes from a Pool (by resizing/shrinking the pool) or when the Job is being disabled, the user can specify that running Tasks on the Compute Nodes be requeued for execution. This count tracks how many times the Task has been requeued for these reasons.")
  requeueCount: int32;

  @doc("The most recent time at which the Task has been requeued by the Batch service as the result of a user request. This property is set only if the requeueCount is nonzero.")
  lastRequeueTime?: utcDateTime;

  @doc("The result of the Task execution. If the value is 'failed', then the details of the failure can be found in the failureInfo property.")
  result?: BatchTaskExecutionResult;
}

@doc("Information about the Compute Node on which a Task ran.")
model BatchNodeInfo {
  @doc("An identifier for the Node on which the Task ran, which can be passed when adding a Task to request that the Task be scheduled on this Compute Node.")
  affinityId?: string;

  @doc("The URL of the Compute Node on which the Task ran.")
  @clientName("nodeUri", "csharp")
  nodeUrl?: url;

  @doc("The ID of the Pool on which the Task ran.")
  poolId?: string;

  @doc("The ID of the Compute Node on which the Task ran.")
  nodeId?: string;

  @doc("The root directory of the Task on the Compute Node.")
  taskRootDirectory?: string;

  @doc("The URL to the root directory of the Task on the Compute Node.")
  @clientName("taskRootDirectoryUri", "csharp")
  taskRootDirectoryUrl?: url;
}

@doc("""
  Multi-instance Tasks are commonly used to support MPI Tasks. In the MPI case,
  if any of the subtasks fail (for example due to exiting with a non-zero exit
  code) the entire multi-instance Task fails. The multi-instance Task is then
  terminated and retried, up to its retry limit.
  """)
model MultiInstanceSettings {
  @doc("The number of Compute Nodes required by the Task. If omitted, the default is 1.")
  numberOfInstances?: int32;

  @doc("The command line to run on all the Compute Nodes to enable them to coordinate when the primary runs the main Task command. A typical coordination command line launches a background service and verifies that the service is ready to process inter-node messages.")
  coordinationCommandLine: string;

  @doc("A list of files that the Batch service will download before running the coordination command line. The difference between common resource files and Task resource files is that common resource files are downloaded for all subtasks including the primary, whereas Task resource files are downloaded only for the primary. Also note that these resource files are not downloaded to the Task working directory, but instead are downloaded to the Task root directory (one directory above the working directory).  There is a maximum size for the list of resource files.  When the max size is exceeded, the request will fail and the response error code will be RequestEntityTooLarge. If this occurs, the collection of ResourceFiles must be reduced in size. This can be achieved using .zip files, Application Packages, or Docker Containers.")
  commonResourceFiles?: ResourceFile[];
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("Resource usage statistics for a Task.")
model BatchTaskStatistics {
  @doc("The URL of the statistics.")
  @clientName("uri", "csharp")
  url: url;

  @doc("The start time of the time range covered by the statistics.")
  startTime: utcDateTime;

  @doc("The time at which the statistics were last updated. All statistics are limited to the range between startTime and lastUpdateTime.")
  lastUpdateTime: utcDateTime;

  @doc("The total user mode CPU time (summed across all cores and all Compute Nodes) consumed by the Task.")
  @clientName("userCpuTime")
  userCPUTime: duration;

  @doc("The total kernel mode CPU time (summed across all cores and all Compute Nodes) consumed by the Task.")
  @clientName("kernelCpuTime")
  kernelCPUTime: duration;

  @doc("The total wall clock time of the Task. The wall clock time is the elapsed time from when the Task started running on a Compute Node to when it finished (or to the last time the statistics were updated, if the Task had not finished by then). If the Task was retried, this includes the wall clock time of all the Task retries.")
  wallClockTime: duration;

  @doc("The total number of disk read operations made by the Task.")
  @encode(string)
  @clientName("readIops")
  readIOps: int64;

  @doc("The total number of disk write operations made by the Task.")
  @encode(string)
  @clientName("writeIops")
  writeIOps: int64;

  @doc("The total gibibytes read from disk by the Task.")
  @clientName("readIoGiB")
  readIOGiB: float32;

  @doc("The total gibibytes written to disk by the Task.")
  @clientName("writeIoGiB")
  writeIOGiB: float32;

  @doc("The total wait time of the Task. The wait time for a Task is defined as the elapsed time between the creation of the Task and the start of Task execution. (If the Task is retried due to failures, the wait time is the time to the most recent Task execution.).")
  waitTime: duration;
}

@doc("""
  Specifies any dependencies of a Task. Any Task that is explicitly specified or
  within a dependency range must complete before the dependant Task will be
  scheduled.
  """)
model BatchTaskDependencies {
  @doc("The list of Task IDs that this Task depends on. All Tasks in this list must complete successfully before the dependent Task can be scheduled. The taskIds collection is limited to 64000 characters total (i.e. the combined length of all Task IDs). If the taskIds collection exceeds the maximum length, the Add Task request fails with error code TaskDependencyListTooLong. In this case consider using Task ID ranges instead.")
  taskIds?: string[];

  @doc("The list of Task ID ranges that this Task depends on. All Tasks in all ranges must complete successfully before the dependent Task can be scheduled.")
  taskIdRanges?: BatchTaskIdRange[];
}

@doc("""
  The start and end of the range are inclusive. For example, if a range has start
  9 and end 12, then it represents Tasks '9', '10', '11' and '12'.
  """)
model BatchTaskIdRange {
  @doc("The first Task ID in the range.")
  start: int32;

  @doc("The last Task ID in the range.")
  end: int32;
}

@doc("The result of listing the Tasks in a Job.")
model BatchTaskListResult {
  @doc("The list of Tasks.")
  @pageItems
  value?: BatchTask[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("A collection of Azure Batch Tasks to add.")
model BatchTaskGroup {
  @doc("The collection of Tasks to add. The maximum count of Tasks is 100. The total serialized size of this collection must be less than 1MB. If it is greater than 1MB (for example if each Task has 100's of resource files or environment variables), the request will fail with code 'RequestBodyTooLarge' and should be retried again with fewer Tasks.")
  @clientName("values")
  value: BatchTaskCreateOptions[];
}

@doc("The result of creating a collection of Tasks to a Job.")
model BatchCreateTaskCollectionResult {
  @doc("The results of the create Task collection operation.")
  @clientName("values")
  value?: BatchTaskCreateResult[];
}

@doc("Result for a single Task created as part of an add Task collection operation.")
model BatchTaskCreateResult {
  @doc("The status of the add Task request.")
  status: BatchTaskAddStatus;

  @doc("The ID of the Task for which this is the result.")
  taskId: string;

  @doc("The ETag of the Task, if the Task was successfully added. You can use this to detect whether the Task has changed between requests. In particular, you can be pass the ETag with an Update Task request to specify that your changes should take effect only if nobody else has modified the Job in the meantime.")
  eTag?: eTag;

  @doc("The last modified time of the Task.")
  lastModified?: utcDateTime;

  @doc("The URL of the Task, if the Task was successfully added.")
  location?: string;

  @doc("The error encountered while attempting to add the Task.")
  error?: BatchError;
}

@doc("The result of listing the subtasks of a Task.")
model BatchTaskListSubtasksResult {
  @doc("The list of subtasks.")
  @pageItems
  value?: BatchSubtask[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

@doc("Information about an Azure Batch subtask.")
model BatchSubtask {
  @doc("The ID of the subtask.")
  id?: int32;

  @doc("Information about the Compute Node on which the subtask ran.")
  nodeInfo?: BatchNodeInfo;

  @doc("The time at which the subtask started running. If the subtask has been restarted or retried, this is the most recent time at which the subtask started running.")
  startTime?: utcDateTime;

  @doc("The time at which the subtask completed. This property is set only if the subtask is in the Completed state.")
  endTime?: utcDateTime;

  @doc("The exit code of the program specified on the subtask command line. This property is set only if the subtask is in the completed state. In general, the exit code for a process reflects the specific convention implemented by the application developer for that process. If you use the exit code value to make decisions in your code, be sure that you know the exit code convention used by the application process. However, if the Batch service terminates the subtask (due to timeout, or user termination via the API) you may see an operating system-defined exit code.")
  exitCode?: int32;

  @doc("Information about the container under which the Task is executing. This property is set only if the Task runs in a container context.")
  containerInfo?: BatchTaskContainerExecutionInfo;

  @doc("Information describing the Task failure, if any. This property is set only if the Task is in the completed state and encountered a failure.")
  failureInfo?: BatchTaskFailureInfo;

  @doc("The current state of the subtask.")
  state?: BatchSubtaskState;

  @doc("The time at which the subtask entered its current state.")
  stateTransitionTime?: utcDateTime;

  @doc("The previous state of the subtask. This property is not set if the subtask is in its initial running state.")
  previousState?: BatchSubtaskState;

  @doc("The time at which the subtask entered its previous state. This property is not set if the subtask is in its initial running state.")
  previousStateTransitionTime?: utcDateTime;

  @doc("The result of the Task execution. If the value is 'failed', then the details of the failure can be found in the failureInfo property.")
  result?: BatchTaskExecutionResult;
}

@doc("Describes an upgrade policy - automatic, manual, or rolling.")
model UpgradePolicy {
  @doc("Specifies the mode of an upgrade to virtual machines in the scale set.<br /><br /> Possible values are:<br /><br /> **Manual** - You  control the application of updates to virtual machines in the scale set. You do this by using the manualUpgrade action.<br /><br /> **Automatic** - All virtual machines in the scale set are automatically updated at the same time.<br /><br /> **Rolling** - Scale set performs updates in batches with an optional pause time in between.")
  mode: UpgradeMode;

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("Configuration parameters used for performing automatic OS Upgrade. The configuration parameters used for performing automatic OS upgrade.")
  @clientName("automaticOsUpgradePolicy")
  automaticOSUpgradePolicy?: AutomaticOsUpgradePolicy;

  @doc("The configuration parameters used while performing a rolling upgrade.")
  rollingUpgradePolicy?: RollingUpgradePolicy;
}

@doc("The configuration parameters used for performing automatic OS upgrade.")
model AutomaticOsUpgradePolicy {
  @doc("Whether OS image rollback feature should be disabled.")
  disableAutomaticRollback?: boolean;

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("Indicates whether OS upgrades should automatically be applied to scale set instances in a rolling fashion when a newer version of the OS image becomes available. <br /><br /> If this is set to true for Windows based pools, [WindowsConfiguration.enableAutomaticUpdates](https://learn.microsoft.com/rest/api/batchservice/pool/add?tabs=HTTP#windowsconfiguration) cannot be set to true.")
  @clientName("enableAutomaticOsUpgrade")
  enableAutomaticOSUpgrade?: boolean;

  @doc("Indicates whether rolling upgrade policy should be used during Auto OS Upgrade. Auto OS Upgrade will fallback to the default policy if no policy is defined on the VMSS.")
  useRollingUpgradePolicy?: boolean;

  @doc("Defer OS upgrades on the TVMs if they are running tasks.")
  osRollingUpgradeDeferral?: boolean;
}

@doc("The configuration parameters used while performing a rolling upgrade.")
model RollingUpgradePolicy {
  @doc("Allow VMSS to ignore AZ boundaries when constructing upgrade batches. Take into consideration the Update Domain and maxBatchInstancePercent to determine the batch size. This field is able to be set to true or false only when using NodePlacementConfiguration as Zonal.")
  enableCrossZoneUpgrade?: boolean;

  @doc("The maximum percent of total virtual machine instances that will be upgraded simultaneously by the rolling upgrade in one batch. As this is a maximum, unhealthy instances in previous or future batches can cause the percentage of instances in a batch to decrease to ensure higher reliability. The value of this field should be between 5 and 100, inclusive. If both maxBatchInstancePercent and maxUnhealthyInstancePercent are assigned with value, the value of maxBatchInstancePercent should not be more than maxUnhealthyInstancePercent.")
  maxBatchInstancePercent?: int32;

  @doc("The maximum percentage of the total virtual machine instances in the scale set that can be simultaneously unhealthy, either as a result of being upgraded, or by being found in an unhealthy state by the virtual machine health checks before the rolling upgrade aborts. This constraint will be checked prior to starting any batch. The value of this field should be between 5 and 100, inclusive. If both maxBatchInstancePercent and maxUnhealthyInstancePercent are assigned with value, the value of maxBatchInstancePercent should not be more than maxUnhealthyInstancePercent.")
  maxUnhealthyInstancePercent?: int32;

  @doc("The maximum percentage of upgraded virtual machine instances that can be found to be in an unhealthy state. This check will happen after each batch is upgraded. If this percentage is ever exceeded, the rolling update aborts. The value of this field should be between 0 and 100, inclusive.")
  maxUnhealthyUpgradedInstancePercent?: int32;

  @doc("The wait time between completing the update for all virtual machines in one batch and starting the next batch. The time duration should be specified in ISO 8601 format..")
  pauseTimeBetweenBatches?: duration;

  @doc("Upgrade all unhealthy instances in a scale set before any healthy instances.")
  prioritizeUnhealthyInstances?: boolean;

  @doc("Rollback failed instances to previous model if the Rolling Upgrade policy is violated.")
  rollbackFailedInstancesOnPolicyBreach?: boolean;
}

@doc("Parameters for creating a user account for RDP or SSH access on an Azure Batch Compute Node.")
model BatchNodeUserCreateOptions {
  @doc("The user name of the Account.")
  name: string;

  @doc("Whether the Account should be an administrator on the Compute Node. The default value is false.")
  isAdmin?: boolean;

  @doc("The time at which the Account should expire. If omitted, the default is 1 day from the current time. For Linux Compute Nodes, the expiryTime has a precision up to a day.")
  expiryTime?: utcDateTime;

  @secret
  @doc("The password of the Account. The password is required for Windows Compute Nodes. For Linux Compute Nodes, the password can optionally be specified along with the sshPublicKey property.")
  password?: string;

  @doc("The SSH public key that can be used for remote login to the Compute Node. The public key should be compatible with OpenSSH encoding and should be base 64 encoded. This property can be specified only for Linux Compute Nodes. If this is specified for a Windows Compute Node, then the Batch service rejects the request; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request).")
  sshPublicKey?: string;
}

@doc("Parameters for updating a user account for RDP or SSH access on an Azure Batch Compute Node.")
model BatchNodeUserUpdateOptions {
  @secret
  @doc("The password of the Account. The password is required for Windows Compute Nodes. For Linux Compute Nodes, the password can optionally be specified along with the sshPublicKey property. If omitted, any existing password is removed.")
  password?: string;

  @doc("The time at which the Account should expire. If omitted, the default is 1 day from the current time. For Linux Compute Nodes, the expiryTime has a precision up to a day.")
  expiryTime?: utcDateTime;

  @doc("The SSH public key that can be used for remote login to the Compute Node. The public key should be compatible with OpenSSH encoding and should be base 64 encoded. This property can be specified only for Linux Compute Nodes. If this is specified for a Windows Compute Node, then the Batch service rejects the request; if you are calling the REST API directly, the HTTP status code is 400 (Bad Request). If omitted, any existing SSH public key is removed.")
  sshPublicKey?: string;
}

@doc("A Compute Node in the Batch service.")
model BatchNode {
  @doc("The ID of the Compute Node. Every Compute Node that is added to a Pool is assigned a unique ID. Whenever a Compute Node is removed from a Pool, all of its local files are deleted, and the ID is reclaimed and could be reused for new Compute Nodes.")
  id?: string;

  @doc("The URL of the Compute Node.")
  @clientName("uri", "csharp")
  url?: url;

  @doc("The current state of the Compute Node. The Spot/Low-priority Compute Node has been preempted. Tasks which were running on the Compute Node when it was preempted will be rescheduled when another Compute Node becomes available.")
  state?: BatchNodeState;

  @doc("Whether the Compute Node is available for Task scheduling.")
  schedulingState?: SchedulingState;

  @doc("The time at which the Compute Node entered its current state.")
  stateTransitionTime?: utcDateTime;

  @doc("The last time at which the Compute Node was started. This property may not be present if the Compute Node state is unusable.")
  lastBootTime?: utcDateTime;

  @doc("The time at which this Compute Node was allocated to the Pool. This is the time when the Compute Node was initially allocated and doesn't change once set. It is not updated when the Compute Node is service healed or preempted.")
  allocationTime?: utcDateTime;

  @doc("The IP address that other Nodes can use to communicate with this Compute Node. Every Compute Node that is added to a Pool is assigned a unique IP address. Whenever a Compute Node is removed from a Pool, all of its local files are deleted, and the IP address is reclaimed and could be reused for new Compute Nodes.")
  ipAddress?: ipV4Address;

  @doc("An identifier which can be passed when adding a Task to request that the Task be scheduled on this Compute Node. Note that this is just a soft affinity. If the target Compute Node is busy or unavailable at the time the Task is scheduled, then the Task will be scheduled elsewhere.")
  affinityId?: string;

  @doc("The size of the virtual machine hosting the Compute Node. For information about available sizes of virtual machines in Pools, see Choose a VM size for Compute Nodes in an Azure Batch Pool (https://learn.microsoft.com/azure/batch/batch-pool-vm-sizes).")
  vmSize?: string;

  @doc("The total number of Job Tasks completed on the Compute Node. This includes Job Manager Tasks and normal Tasks, but not Job Preparation, Job Release or Start Tasks.")
  totalTasksRun?: int32;

  @doc("The total number of currently running Job Tasks on the Compute Node. This includes Job Manager Tasks and normal Tasks, but not Job Preparation, Job Release or Start Tasks.")
  runningTasksCount?: int32;

  @doc("The total number of scheduling slots used by currently running Job Tasks on the Compute Node. This includes Job Manager Tasks and normal Tasks, but not Job Preparation, Job Release or Start Tasks.")
  runningTaskSlotsCount?: int32;

  @doc("The total number of Job Tasks which completed successfully (with exitCode 0) on the Compute Node. This includes Job Manager Tasks and normal Tasks, but not Job Preparation, Job Release or Start Tasks.")
  totalTasksSucceeded?: int32;

  @doc("A list of Tasks whose state has recently changed. This property is present only if at least one Task has run on this Compute Node since it was assigned to the Pool.")
  recentTasks?: BatchTaskInfo[];

  @doc("The Task specified to run on the Compute Node as it joins the Pool.")
  startTask?: BatchStartTask;

  @doc("Runtime information about the execution of the StartTask on the Compute Node.")
  startTaskInfo?: BatchStartTaskInfo;

  @doc("""
    For Windows Nodes, the Batch service installs the Certificates to the specified Certificate store and location.
    For Linux Compute Nodes, the Certificates are stored in a directory inside the Task working directory and an environment variable AZ_BATCH_CERTIFICATES_DIR is supplied to the Task to query for this location.
    For Certificates with visibility of 'remoteUser', a 'certs' directory is created in the user's home directory (e.g., /home/{user-name}/certs) and Certificates are placed in that directory.
    Warning: This property is deprecated and will be removed after February, 2024. Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead.
    """)
  certificateReferences?: BatchCertificateReference[];

  @doc("The list of errors that are currently being encountered by the Compute Node.")
  errors?: BatchNodeError[];

  @doc("Whether this Compute Node is a dedicated Compute Node. If false, the Compute Node is a Spot/Low-priority Compute Node.")
  isDedicated?: boolean;

  @doc("The endpoint configuration for the Compute Node.")
  endpointConfiguration?: BatchNodeEndpointConfiguration;

  @doc("Information about the Compute Node agent version and the time the Compute Node upgraded to a new version.")
  nodeAgentInfo?: BatchNodeAgentInfo;

  @doc("Info about the current state of the virtual machine.")
  virtualMachineInfo?: VirtualMachineInfo;
}

@doc("Information about a Task running on a Compute Node.")
model BatchTaskInfo {
  @doc("The URL of the Task.")
  @clientName("taskUri", "csharp")
  taskUrl?: url;

  @doc("The ID of the Job to which the Task belongs.")
  jobId?: string;

  @doc("The ID of the Task.")
  taskId?: string;

  @doc("The ID of the subtask if the Task is a multi-instance Task.")
  subtaskId?: int32;

  @doc("The current state of the Task.")
  taskState: BatchTaskState;

  @doc("Information about the execution of the Task.")
  executionInfo?: BatchTaskExecutionInfo;
}

@doc("Information about a StartTask running on a Compute Node.")
model BatchStartTaskInfo {
  @doc("The state of the StartTask on the Compute Node.")
  state: BatchStartTaskState;

  @doc("The time at which the StartTask started running. This value is reset every time the Task is restarted or retried (that is, this is the most recent time at which the StartTask started running).")
  startTime: utcDateTime;

  @doc("The time at which the StartTask stopped running. This is the end time of the most recent run of the StartTask, if that run has completed (even if that run failed and a retry is pending). This element is not present if the StartTask is currently running.")
  endTime?: utcDateTime;

  @doc("The exit code of the program specified on the StartTask command line. This property is set only if the StartTask is in the completed state. In general, the exit code for a process reflects the specific convention implemented by the application developer for that process. If you use the exit code value to make decisions in your code, be sure that you know the exit code convention used by the application process. However, if the Batch service terminates the StartTask (due to timeout, or user termination via the API) you may see an operating system-defined exit code.")
  exitCode?: int32;

  @doc("Information about the container under which the Task is executing. This property is set only if the Task runs in a container context.")
  containerInfo?: BatchTaskContainerExecutionInfo;

  @doc("Information describing the Task failure, if any. This property is set only if the Task is in the completed state and encountered a failure.")
  failureInfo?: BatchTaskFailureInfo;

  @doc("The number of times the Task has been retried by the Batch service. Task application failures (non-zero exit code) are retried, pre-processing errors (the Task could not be run) and file upload errors are not retried. The Batch service will retry the Task up to the limit specified by the constraints.")
  retryCount: int32;

  @doc("The most recent time at which a retry of the Task started running. This element is present only if the Task was retried (i.e. retryCount is nonzero). If present, this is typically the same as startTime, but may be different if the Task has been restarted for reasons other than retry; for example, if the Compute Node was rebooted during a retry, then the startTime is updated but the lastRetryTime is not.")
  lastRetryTime?: utcDateTime;

  @doc("The result of the Task execution. If the value is 'failed', then the details of the failure can be found in the failureInfo property.")
  result?: BatchTaskExecutionResult;
}

@doc("An error encountered by a Compute Node.")
model BatchNodeError {
  @doc("An identifier for the Compute Node error. Codes are invariant and are intended to be consumed programmatically.")
  code?: string;

  @doc("A message describing the Compute Node error, intended to be suitable for display in a user interface.")
  message?: string;

  @doc("The list of additional error details related to the Compute Node error.")
  errorDetails?: NameValuePair[];
}

@doc("The endpoint configuration for the Compute Node.")
model BatchNodeEndpointConfiguration {
  @doc("The list of inbound endpoints that are accessible on the Compute Node.")
  inboundEndpoints: InboundEndpoint[];
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("An inbound endpoint on a Compute Node.")
model InboundEndpoint {
  @doc("The name of the endpoint.")
  name: string;

  @doc("The protocol of the endpoint.")
  protocol: InboundEndpointProtocol;

  @doc("The public IP address of the Compute Node.")
  @clientName("publicIpAddress")
  publicIPAddress: ipV4Address;

  @doc("The public fully qualified domain name for the Compute Node.")
  publicFQDN: string;

  @doc("The public port number of the endpoint.")
  frontendPort: int32;

  @doc("The backend port number of the endpoint.")
  backendPort: int32;
}

@doc("""
  The Batch Compute Node agent is a program that runs on each Compute Node in the
  Pool and provides Batch capability on the Compute Node.
  """)
model BatchNodeAgentInfo {
  @doc("The version of the Batch Compute Node agent running on the Compute Node. This version number can be checked against the Compute Node agent release notes located at https://github.com/Azure/Batch/blob/master/changelogs/nodeagent/CHANGELOG.md.")
  version: string;

  @doc("The time when the Compute Node agent was updated on the Compute Node. This is the most recent time that the Compute Node agent was updated to a new version.")
  lastUpdateTime: utcDateTime;
}

@doc("Info about the current state of the virtual machine.")
model VirtualMachineInfo {
  @doc("The reference to the Azure Virtual Machine's Marketplace Image.")
  imageReference?: BatchVmImageReference;

  @doc("The resource ID of the Compute Node's current Virtual Machine Scale Set VM. Only defined if the Batch Account was created with its poolAllocationMode property set to 'UserSubscription'.")
  scaleSetVmResourceId?: string;
}

@doc("Parameters for rebooting an Azure Batch Compute Node.")
model BatchNodeRebootOptions {
  @doc("When to reboot the Compute Node and what to do with currently running Tasks. The default value is requeue.")
  @clientName("nodeRebootKind")
  nodeRebootOption?: BatchNodeRebootKind;
}

@doc("Parameters for reimaging an Azure Batch Compute Node.")
model BatchNodeReimageOptions {
  @doc("When to reimage the Compute Node and what to do with currently running Tasks. The default value is requeue.")
  nodeReimageOption?: BatchNodeReimageOption;
}

@doc("Parameters for disabling scheduling on an Azure Batch Compute Node.")
model BatchNodeDisableSchedulingOptions {
  @doc("What to do with currently running Tasks when disabling Task scheduling on the Compute Node. The default value is requeue.")
  nodeDisableSchedulingOption?: BatchNodeDisableSchedulingOption;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("The remote login settings for a Compute Node.")
model BatchNodeRemoteLoginSettings {
  @doc("The IP address used for remote login to the Compute Node.")
  @clientName("remoteLoginIpAddress")
  remoteLoginIPAddress: ipV4Address;

  @doc("The port used for remote login to the Compute Node.")
  remoteLoginPort: int32;
}

@doc("The Azure Batch service log files upload parameters for a Compute Node.")
model UploadBatchServiceLogsOptions {
  @doc("The URL of the container within Azure Blob Storage to which to upload the Batch Service log file(s). If a user assigned managed identity is not being used, the URL must include a Shared Access Signature (SAS) granting write permissions to the container. The SAS duration must allow enough time for the upload to finish. The start time for SAS is optional and recommended to not be specified.")
  @clientName("containerUri", "csharp")
  containerUrl: url;

  @doc("The start of the time range from which to upload Batch Service log file(s). Any log file containing a log message in the time range will be uploaded. This means that the operation might retrieve more logs than have been requested since the entire log file is always uploaded, but the operation should not retrieve fewer logs than have been requested.")
  startTime: utcDateTime;

  @doc("The end of the time range from which to upload Batch Service log file(s). Any log file containing a log message in the time range will be uploaded. This means that the operation might retrieve more logs than have been requested since the entire log file is always uploaded, but the operation should not retrieve fewer logs than have been requested. If omitted, the default is to upload all logs available after the startTime.")
  endTime?: utcDateTime;

  @doc("The reference to the user assigned identity to use to access Azure Blob Storage specified by containerUrl. The identity must have write access to the Azure Blob Storage container.")
  identityReference?: BatchNodeIdentityReference;
}

@doc("The result of uploading Batch service log files from a specific Compute Node.")
model UploadBatchServiceLogsResult {
  @doc("The virtual directory within Azure Blob Storage container to which the Batch Service log file(s) will be uploaded. The virtual directory name is part of the blob name for each log file uploaded, and it is built based poolId, nodeId and a unique identifier.")
  virtualDirectoryName: string;

  @doc("The number of log files which will be uploaded.")
  numberOfFilesUploaded: int32;
}

@doc("The result of listing the Compute Nodes in a Pool.")
model BatchNodeListResult {
  @doc("The list of Compute Nodes.")
  @pageItems
  value?: BatchNode[];

  #suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}

#suppress "@azure-tools/typespec-azure-core/casing-style"
@doc("The configuration for virtual machine extension instance view.")
model BatchNodeVMExtension {
  @doc("The provisioning state of the virtual machine extension.")
  provisioningState?: string;

  @doc("The virtual machine extension.")
  vmExtension?: VMExtension;

  @doc("The vm extension instance view.")
  instanceView?: VMExtensionInstanceView;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Property types must use camelCase"
@doc("The vm extension instance view.")
model VMExtensionInstanceView {
  @doc("The name of the vm extension instance view.")
  name?: string;

  @doc("The resource status information.")
  statuses?: InstanceViewStatus[];

  @doc("The resource status information.")
  subStatuses?: InstanceViewStatus[];
}

@doc("The instance view status.")
model InstanceViewStatus {
  @doc("The status code.")
  code?: string;

  @doc("The localized label for the status.")
  displayStatus?: string;

  @doc("Level code.")
  level?: StatusLevelTypes;

  @doc("The detailed status message.")
  message?: string;

  @doc("The time of the status.")
  time?: utcDateTime;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "The names of Model types must use camelCase"
@doc("The result of listing the Compute Node extensions in a Node.")
model BatchNodeVMExtensionListResult {
  @doc("The list of Compute Node extensions.")
  @pageItems
  value?: BatchNodeVMExtension[];

  @doc("The URL to get the next set of results.")
  @nextLink
  `odata.nextLink`?: url;
}
