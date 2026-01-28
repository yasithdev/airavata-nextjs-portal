/**
 * Helper functions for generating permalink URLs
 */

export function getDatasetPermalink(datasetId: string): string {
  return `/datasets/${datasetId}`;
}

export function getRepositoryPermalink(repositoryId: string): string {
  return `/repositories/${repositoryId}`;
}

export function getApplicationPermalink(appId: string): string {
  return `/applications/${appId}`;
}

export function getExperimentPermalink(experimentId: string): string {
  return `/experiments/${experimentId}`;
}

/**
 * Get permalink for a catalog resource based on its type
 */
export function getCatalogResourcePermalink(resourceId: string, resourceType: "DATASET" | "REPOSITORY"): string {
  if (resourceType === "DATASET") {
    return getDatasetPermalink(resourceId);
  }
  return getRepositoryPermalink(resourceId);
}
