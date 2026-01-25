// Airavata API Types

// Gateway
export interface Gateway {
  gatewayId: string;
  gatewayName: string;
  gatewayURL?: string;
  gatewayAdminFirstName?: string;
  gatewayAdminLastName?: string;
  gatewayAdminEmail?: string;
  domain?: string;
  emailAddress?: string;
  gatewayApprovalStatus?: string;
  gatewayAcronym?: string;
  gatewayPublicAbstract?: string;
  reviewProposalDescription?: string;
  declinedReason?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  requestedCreationTime?: number;
  requesterUsername?: string;
}

// Project
export interface Project {
  projectID: string;
  owner: string;
  gatewayId: string;
  name: string;
  description?: string;
  creationTime?: number;
  sharedUsers?: string[];
  sharedGroups?: string[];
}

// Experiment
export interface ExperimentModel {
  experimentId: string;
  projectId: string;
  gatewayId: string;
  experimentType: ExperimentType;
  userName: string;
  experimentName: string;
  creationTime?: number;
  description?: string;
  executionId?: string;
  gatewayExecutionId?: string;
  gatewayInstanceId?: string;
  enableEmailNotification?: boolean;
  emailAddresses?: string[];
  userConfigurationData?: UserConfigurationDataModel;
  experimentInputs?: InputDataObjectType[];
  experimentOutputs?: OutputDataObjectType[];
  experimentStatus?: ExperimentStatus[];
  errors?: ErrorModel[];
  processes?: ProcessModel[];
  workflow?: AiravataWorkflow;
  archiveStatus?: boolean;
}

export enum ExperimentType {
  SINGLE_APPLICATION = 'SINGLE_APPLICATION',
  WORKFLOW = 'WORKFLOW',
}

export interface UserConfigurationDataModel {
  airavataAutoSchedule?: boolean;
  overrideManualScheduledParams?: boolean;
  shareExperimentPublicly?: boolean;
  computationalResourceScheduling?: ComputationalResourceSchedulingModel;
  throttleResources?: boolean;
  userDN?: string;
  generateCert?: boolean;
  storageId?: string;
  experimentDataDir?: string;
  useUserCRPref?: boolean;
  groupResourceProfileId?: string;
}

export interface ComputationalResourceSchedulingModel {
  resourceHostId?: string;
  totalCPUCount?: number;
  nodeCount?: number;
  numberOfThreads?: number;
  queueName?: string;
  wallTimeLimit?: number;
  totalPhysicalMemory?: number;
  staticWorkingDir?: string;
  overrideLoginUserName?: string;
  overrideScratchLocation?: string;
  overrideAllocationProjectNumber?: string;
}

export interface InputDataObjectType {
  name: string;
  value?: string;
  type: DataType;
  applicationArgument?: string;
  standardInput?: boolean;
  userFriendlyDescription?: string;
  metaData?: string;
  inputOrder?: number;
  isRequired?: boolean;
  requiredToAddedToCommandLine?: boolean;
  dataStaged?: boolean;
  storageResourceId?: string;
  isReadOnly?: boolean;
  overrideFilename?: string;
}

export interface OutputDataObjectType {
  name: string;
  value?: string;
  type: DataType;
  applicationArgument?: string;
  isRequired?: boolean;
  requiredToAddedToCommandLine?: boolean;
  dataMovement?: boolean;
  location?: string;
  searchQuery?: string;
  outputStreaming?: boolean;
  storageResourceId?: string;
  metaData?: string;
}

export enum DataType {
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  URI = 'URI',
  URI_COLLECTION = 'URI_COLLECTION',
  STDOUT = 'STDOUT',
  STDERR = 'STDERR',
}

export interface ExperimentStatus {
  state: ExperimentState;
  timeOfStateChange?: number;
  reason?: string;
  statusId?: string;
}

export enum ExperimentState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  SCHEDULED = 'SCHEDULED',
  LAUNCHED = 'LAUNCHED',
  EXECUTING = 'EXECUTING',
  CANCELING = 'CANCELING',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ErrorModel {
  errorId: string;
  creationTime?: number;
  actualErrorMessage?: string;
  userFriendlyMessage?: string;
  transientOrPersistent?: boolean;
  rootCauseErrorIdList?: string[];
}

// Process
export interface ProcessModel {
  processId: string;
  experimentId: string;
  creationTime?: number;
  lastUpdateTime?: number;
  processStatuses?: ProcessStatus[];
  processDetail?: string;
  applicationInterfaceId?: string;
  applicationDeploymentId?: string;
  computeResourceId?: string;
  processInputs?: InputDataObjectType[];
  processOutputs?: OutputDataObjectType[];
  processResourceSchedule?: ComputationalResourceSchedulingModel;
  tasks?: TaskModel[];
  taskDag?: string;
  processErrors?: ErrorModel[];
  gatewayExecutionId?: string;
  enableEmailNotification?: boolean;
  emailAddresses?: string[];
  storageResourceId?: string;
  userDn?: string;
  generateCert?: boolean;
  experimentDataDir?: string;
  userName?: string;
  useUserCRPref?: boolean;
  groupResourceProfileId?: string;
}

export interface ProcessStatus {
  state: ProcessState;
  timeOfStateChange?: number;
  reason?: string;
  statusId?: string;
}

export enum ProcessState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  STARTED = 'STARTED',
  PRE_PROCESSING = 'PRE_PROCESSING',
  CONFIGURING_WORKSPACE = 'CONFIGURING_WORKSPACE',
  INPUT_DATA_STAGING = 'INPUT_DATA_STAGING',
  EXECUTING = 'EXECUTING',
  MONITORING = 'MONITORING',
  OUTPUT_DATA_STAGING = 'OUTPUT_DATA_STAGING',
  POST_PROCESSING = 'POST_PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLING = 'CANCELLING',
  CANCELED = 'CANCELED',
}

export interface TaskModel {
  taskId: string;
  taskType: TaskTypes;
  parentProcessId: string;
  creationTime?: number;
  lastUpdateTime?: number;
  taskStatuses?: TaskStatus[];
  taskDetail?: string;
  taskErrors?: ErrorModel[];
  jobs?: JobModel[];
  maxRetry?: number;
  currentRetry?: number;
}

export enum TaskTypes {
  ENV_SETUP = 'ENV_SETUP',
  DATA_STAGING = 'DATA_STAGING',
  JOB_SUBMISSION = 'JOB_SUBMISSION',
  ENV_CLEANUP = 'ENV_CLEANUP',
  MONITORING = 'MONITORING',
  OUTPUT_FETCHING = 'OUTPUT_FETCHING',
}

export interface TaskStatus {
  state: TaskState;
  timeOfStateChange?: number;
  reason?: string;
  statusId?: string;
}

export enum TaskState {
  CREATED = 'CREATED',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

// Job
export interface JobModel {
  jobId: string;
  taskId: string;
  processId: string;
  jobDescription: string;
  creationTime?: number;
  jobStatuses?: JobStatus[];
  computeResourceConsumed?: string;
  jobName?: string;
  workingDir?: string;
  stdOut?: string;
  stdErr?: string;
  exitCode?: number;
}

export interface JobStatus {
  jobState: JobState;
  timeOfStateChange?: number;
  reason?: string;
  statusId?: string;
}

export enum JobState {
  SUBMITTED = 'SUBMITTED',
  QUEUED = 'QUEUED',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  SUSPENDED = 'SUSPENDED',
  UNKNOWN = 'UNKNOWN',
}

// Application
export interface ApplicationInterfaceDescription {
  applicationInterfaceId: string;
  applicationName: string;
  applicationDescription?: string;
  applicationModules?: string[];
  applicationInputs?: InputDataObjectType[];
  applicationOutputs?: OutputDataObjectType[];
  archiveWorkingDirectory?: boolean;
  hasOptionalFileInputs?: boolean;
}

export interface ApplicationModule {
  appModuleId: string;
  appModuleName: string;
  appModuleVersion?: string;
  appModuleDescription?: string;
}

export interface ApplicationDeploymentDescription {
  appDeploymentId: string;
  appModuleId: string;
  computeHostId: string;
  executablePath: string;
  parallelism: ApplicationParallelismType;
  appDeploymentDescription?: string;
  defaultQueueName?: string;
  defaultNodeCount?: number;
  defaultCPUCount?: number;
  defaultWalltime?: number;
  editableByUser?: boolean;
}

export enum ApplicationParallelismType {
  SERIAL = 'SERIAL',
  MPI = 'MPI',
  OPENMP = 'OPENMP',
  OPENMP_MPI = 'OPENMP_MPI',
  CCM = 'CCM',
  CRAY_MPI = 'CRAY_MPI',
}

// Compute Resource
export interface ComputeResourceDescription {
  computeResourceId: string;
  hostName: string;
  hostAliases?: string[];
  ipAddresses?: string[];
  resourceDescription?: string;
  enabled?: boolean;
  batchQueues?: BatchQueue[];
  maxMemoryPerNode?: number;
  gatewayUsageReporting?: boolean;
  cpusPerNode?: number;
  defaultNodeCount?: number;
  defaultCPUCount?: number;
  defaultWalltime?: number;
}

export interface BatchQueue {
  queueName: string;
  queueDescription?: string;
  maxRunTime?: number;
  maxNodes?: number;
  maxProcessors?: number;
  maxJobsInQueue?: number;
  maxMemory?: number;
  cpuPerNode?: number;
  defaultNodeCount?: number;
  defaultCPUCount?: number;
  defaultWalltime?: number;
  queueSpecificMacros?: string;
  isDefaultQueue?: boolean;
}

// Storage Resource
export interface StorageResourceDescription {
  storageResourceId: string;
  hostName: string;
  storageResourceDescription?: string;
  enabled?: boolean;
  creationTime?: number;
  updateTime?: number;
}

// Data Product
export interface DataProductModel {
  productUri: string;
  gatewayId: string;
  parentProductUri?: string;
  productName: string;
  productDescription?: string;
  ownerName: string;
  dataProductType: DataProductType;
  productSize?: number;
  creationTime?: number;
  lastModifiedTime?: number;
  productMetadata?: Record<string, string>;
  replicaLocations?: DataReplicaLocationModel[];
  childProducts?: DataProductModel[];
}

export enum DataProductType {
  FILE = 'FILE',
  COLLECTION = 'COLLECTION',
}

export interface DataReplicaLocationModel {
  replicaId: string;
  productUri: string;
  replicaName?: string;
  replicaDescription?: string;
  creationTime?: number;
  lastModifiedTime?: number;
  validUntilTime?: number;
  replicaLocationCategory: ReplicaLocationCategory;
  replicaPersistentType: ReplicaPersistentType;
  storageResourceId?: string;
  filePath?: string;
  replicaMetadata?: Record<string, string>;
}

export enum ReplicaLocationCategory {
  GATEWAY_DATA_STORE = 'GATEWAY_DATA_STORE',
  COMPUTE_RESOURCE = 'COMPUTE_RESOURCE',
  LONG_TERM_STORAGE_RESOURCE = 'LONG_TERM_STORAGE_RESOURCE',
}

export enum ReplicaPersistentType {
  TRANSIENT = 'TRANSIENT',
  PERSISTENT = 'PERSISTENT',
}

// Workflow
export interface AiravataWorkflow {
  workflowId: string;
  name: string;
  graph?: string;
  workflowInputs?: InputDataObjectType[];
  workflowOutputs?: OutputDataObjectType[];
}

// User Resource Profile
export interface UserResourceProfile {
  userId: string;
  gatewayID: string;
  credentialStoreToken?: string;
  userComputeResourcePreferences?: UserComputeResourcePreference[];
  userStoragePreferences?: UserStoragePreference[];
  identityServerTenant?: string;
  identityServerPwdCredToken?: string;
}

export interface UserComputeResourcePreference {
  computeResourceId: string;
  loginUserName?: string;
  preferredBatchQueue?: string;
  scratchLocation?: string;
  allocationProjectNumber?: string;
  resourceSpecificCredentialStoreToken?: string;
  qualityOfService?: string;
  reservation?: string;
  reservationStartTime?: number;
  reservationEndTime?: number;
  validated?: boolean;
}

export interface UserStoragePreference {
  storageResourceId: string;
  loginUserName?: string;
  fileSystemRootLocation?: string;
  resourceSpecificCredentialStoreToken?: string;
}

// Group Resource Profile
export interface GroupResourceProfile {
  gatewayId: string;
  groupResourceProfileId: string;
  groupResourceProfileName?: string;
  computePreferences?: GroupComputeResourcePreference[];
  computeResourcePolicies?: ComputeResourcePolicy[];
  batchQueueResourcePolicies?: BatchQueueResourcePolicy[];
  creationTime?: number;
  updatedTime?: number;
  defaultCredentialStoreToken?: string;
}

export interface GroupComputeResourcePreference {
  computeResourceId: string;
  groupResourceProfileId: string;
  overridebyAiravata?: boolean;
  loginUserName?: string;
  preferredBatchQueue?: string;
  scratchLocation?: string;
  allocationProjectNumber?: string;
  resourceSpecificCredentialStoreToken?: string;
  usageReportingGatewayId?: string;
  qualityOfService?: string;
  reservation?: string;
  reservationStartTime?: number;
  reservationEndTime?: number;
  sshAccountProvisioner?: string;
  sshAccountProvisionerAdditionalInfo?: string;
}

export interface ComputeResourcePolicy {
  resourcePolicyId: string;
  computeResourceId: string;
  groupResourceProfileId: string;
  allowedBatchQueues?: string[];
}

export interface BatchQueueResourcePolicy {
  resourcePolicyId: string;
  computeResourceId: string;
  groupResourceProfileId: string;
  queuename: string;
  maxAllowedNodes?: number;
  maxAllowedCores?: number;
  maxAllowedWalltime?: number;
}

// Session/Auth types
export interface User {
  id: string;
  name: string;
  email: string;
  gatewayId: string;
  roles?: string[];
}
