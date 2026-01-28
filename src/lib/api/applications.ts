import { apiClient } from "./client";
import type { 
  ApplicationInterfaceDescription, 
  ApplicationModule,
  ApplicationDeploymentDescription,
  InputDataObjectType,
  OutputDataObjectType 
} from "@/types";

export const applicationsApi = {
  listInterfaces: async (gatewayId?: string): Promise<ApplicationInterfaceDescription[]> => {
    const url = gatewayId 
      ? `/api/v1/application-interfaces?gatewayId=${gatewayId}`
      : "/api/v1/application-interfaces";
    return apiClient.get<ApplicationInterfaceDescription[]>(url);
  },

  getInterface: async (interfaceId: string): Promise<ApplicationInterfaceDescription> => {
    return apiClient.get<ApplicationInterfaceDescription>(`/api/v1/application-interfaces/${interfaceId}`);
  },

  createInterface: async (
    appInterface: Partial<ApplicationInterfaceDescription>, 
    gatewayId: string
  ): Promise<{ interfaceId: string }> => {
    return apiClient.post<{ interfaceId: string }>(
      `/api/v1/application-interfaces?gatewayId=${gatewayId}`, 
      appInterface
    );
  },

  updateInterface: async (
    interfaceId: string, 
    appInterface: Partial<ApplicationInterfaceDescription>
  ): Promise<void> => {
    return apiClient.put(`/api/v1/application-interfaces/${interfaceId}`, appInterface);
  },

  deleteInterface: async (interfaceId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/application-interfaces/${interfaceId}`);
  },

  getInputs: async (interfaceId: string): Promise<InputDataObjectType[]> => {
    return apiClient.get<InputDataObjectType[]>(`/api/v1/application-interfaces/${interfaceId}/inputs`);
  },

  getOutputs: async (interfaceId: string): Promise<OutputDataObjectType[]> => {
    return apiClient.get<OutputDataObjectType[]>(`/api/v1/application-interfaces/${interfaceId}/outputs`);
  },

  listModules: async (gatewayId: string): Promise<ApplicationModule[]> => {
    return apiClient.get<ApplicationModule[]>(`/api/v1/application-modules?gatewayId=${gatewayId}`);
  },

  getModule: async (moduleId: string): Promise<ApplicationModule> => {
    return apiClient.get<ApplicationModule>(`/api/v1/application-modules/${moduleId}`);
  },

  createModule: async (module: Partial<ApplicationModule>, gatewayId: string): Promise<{ moduleId: string }> => {
    return apiClient.post<{ moduleId: string }>(`/api/v1/application-modules?gatewayId=${gatewayId}`, module);
  },

  updateModule: async (moduleId: string, module: Partial<ApplicationModule>): Promise<void> => {
    return apiClient.put(`/api/v1/application-modules/${moduleId}`, module);
  },

  deleteModule: async (moduleId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/application-modules/${moduleId}`);
  },

  listDeployments: async (appModuleId: string): Promise<ApplicationDeploymentDescription[]> => {
    return apiClient.get<ApplicationDeploymentDescription[]>(
      `/api/v1/application-deployments?appModuleId=${appModuleId}`
    );
  },

  getDeployment: async (deploymentId: string): Promise<ApplicationDeploymentDescription> => {
    return apiClient.get<ApplicationDeploymentDescription>(`/api/v1/application-deployments/${deploymentId}`);
  },

  createDeployment: async (
    deployment: Partial<ApplicationDeploymentDescription>,
    gatewayId: string
  ): Promise<{ deploymentId: string }> => {
    return apiClient.post<{ deploymentId: string }>(
      `/api/v1/application-deployments?gatewayId=${gatewayId}`,
      deployment
    );
  },

  updateDeployment: async (
    deploymentId: string,
    deployment: Partial<ApplicationDeploymentDescription>
  ): Promise<void> => {
    return apiClient.put(`/api/v1/application-deployments/${deploymentId}`, deployment);
  },

  deleteDeployment: async (deploymentId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/application-deployments/${deploymentId}`);
  },

  getDeploymentsByCredential: async (credentialToken: string): Promise<ApplicationDeploymentDescription[]> => {
    return apiClient.get<ApplicationDeploymentDescription[]>(
      `/api/v1/application-deployments?credentialToken=${encodeURIComponent(credentialToken)}`
    );
  },
};
