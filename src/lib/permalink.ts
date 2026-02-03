/**
 * Helper functions for generating permalink URLs
 */

export function getDatasetPermalink(datasetId: string): string {
  return `/datasets/${datasetId}`;
}

export function getRepositoryPermalink(repositoryId: string): string {
  return `/repositories/${repositoryId}`;
}

export function getApplicationPermalink(appId: string, gatewayName?: string): string {
  if (gatewayName) {
    return `/${gatewayName}/applications/${appId}`;
  }
  return `/applications/${appId}`;
}

export function getExperimentPermalink(experimentId: string): string {
  return `/experiments/${experimentId}`;
}

/**
 * Get permalink for a catalog resource based on its type
 */
export function getCatalogResourcePermalink(resourceId: string, resourceType: "DATASET" | "REPOSITORY" | "APPLICATION"): string {
  if (resourceType === "DATASET") {
    return getDatasetPermalink(resourceId);
  }
  if (resourceType === "APPLICATION") {
    return `/catalog/APPLICATION/${resourceId}`;
  }
  return getRepositoryPermalink(resourceId);
}
