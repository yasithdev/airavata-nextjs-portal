/**
 * Research Catalog Types
 * 
 * Resource Scope Model:
 * - USER: Resources owned by a specific user (stored in DB)
 * - GATEWAY: Resources owned at gateway level (stored in DB)
 * - DELEGATED: Resources accessible via group credentials but not directly owned (inferred, not stored)
 * 
 * Only USER and GATEWAY can be set when creating resources.
 * DELEGATED is automatically inferred when returning resources accessible via groups.
 */

export enum ResourceType {
  DATASET = "DATASET",
  REPOSITORY = "REPOSITORY",
}

export enum ResourceStatus {
  NONE = "NONE",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum Privacy {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

/**
 * Resource scope enum.
 * 
 * - USER: Resource owned by a specific user (stored in DB)
 * - GATEWAY: Resource owned at gateway level (stored in DB)
 * - DELEGATED: Resource accessible via group credentials but not directly owned (inferred at runtime, not stored)
 * 
 * Only USER and GATEWAY can be set when creating resources.
 * DELEGATED is automatically inferred by the backend when returning resources.
 */
export enum ResourceScope {
  USER = "USER",
  GATEWAY = "GATEWAY",
  DELEGATED = "DELEGATED",
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  type: ResourceType;
  status: ResourceStatus;
  privacy: Privacy;
  scope?: ResourceScope;
  authors: string[];
  tags: Tag[];
  headerImage?: string;
  createdAt: number;
  updatedAt?: number;
  ownerId?: string;
  groupResourceProfileId?: string;
}

export interface DatasetResource extends Resource {
  type: ResourceType.DATASET;
  datasetUrl: string;
  size?: number;
  format?: string;
}

export interface RepositoryResource extends Resource {
  type: ResourceType.REPOSITORY;
  repositoryUrl?: string;
  branch?: string;
  commit?: string;
  // Repository can contain notebooks, models, or general code
  notebookPath?: string;
  jupyterServerUrl?: string;
  modelUrl?: string;
  applicationInterfaceId?: string;
  framework?: string;
}

export type CatalogResource = DatasetResource | RepositoryResource;

export interface ResourceFilters {
  type?: ResourceType;
  tags?: string[];
  nameSearch?: string;
  pageNumber?: number;
  pageSize?: number;
}
