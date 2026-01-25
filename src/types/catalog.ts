// Research Catalog Types

export enum ResourceType {
  NOTEBOOK = "NOTEBOOK",
  DATASET = "DATASET",
  MODEL = "MODEL",
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

export interface Resource {
  id: string;
  name: string;
  description: string;
  type: ResourceType;
  status: ResourceStatus;
  privacy: Privacy;
  authors: string[];
  tags: Tag[];
  headerImage?: string;
  createdAt: number;
  updatedAt?: number;
  ownerId?: string;
}

export interface NotebookResource extends Resource {
  type: ResourceType.NOTEBOOK;
  notebookPath: string;
  jupyterServerUrl?: string;
}

export interface DatasetResource extends Resource {
  type: ResourceType.DATASET;
  datasetUrl: string;
  size?: number;
  format?: string;
}

export interface RepositoryResource extends Resource {
  type: ResourceType.REPOSITORY;
  repositoryUrl: string;
  branch?: string;
  commit?: string;
}

export interface ModelResource extends Resource {
  type: ResourceType.MODEL;
  applicationInterfaceId?: string;
  modelUrl?: string;
  framework?: string;
}

export type CatalogResource = NotebookResource | DatasetResource | RepositoryResource | ModelResource;

export interface ResourceFilters {
  type?: ResourceType;
  tags?: string[];
  nameSearch?: string;
  pageNumber?: number;
  pageSize?: number;
}
