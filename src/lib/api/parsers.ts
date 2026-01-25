import { apiClient } from "./client";

// Types matching the backend model
export interface ParsingTemplateInput {
  id?: string;
  name: string;
  value?: string;
  type?: string;
  applicationArgument?: string;
  parserId?: string;
  parserInputId?: string;
}

export interface ParserConnector {
  id?: string;
  parserId?: string;
  inputParserId?: string;
  inputType?: string;
  outputParserId?: string;
  outputType?: string;
}

export interface ParsingTemplate {
  id?: string;
  applicationInterface: string;
  gatewayId?: string;
  initialInputs?: ParsingTemplateInput[];
  parserConnections?: ParserConnector[];
}

export const parsersApi = {
  list: async (applicationInterfaceId?: string, gatewayId?: string): Promise<ParsingTemplate[]> => {
    const params = new URLSearchParams();
    if (applicationInterfaceId) {
      params.append("applicationInterfaceId", applicationInterfaceId);
    }
    if (gatewayId) {
      params.append("gatewayId", gatewayId);
    }
    const url = params.toString() 
      ? `/api/v1/parsing-templates?${params.toString()}`
      : "/api/v1/parsing-templates";
    return apiClient.get<ParsingTemplate[]>(url);
  },

  get: async (templateId: string): Promise<ParsingTemplate> => {
    return apiClient.get<ParsingTemplate>(`/api/v1/parsing-templates/${templateId}`);
  },

  create: async (
    template: Partial<ParsingTemplate>,
    gatewayId: string
  ): Promise<{ templateId: string }> => {
    return apiClient.post<{ templateId: string }>(
      `/api/v1/parsing-templates?gatewayId=${gatewayId}`,
      template
    );
  },

  update: async (templateId: string, template: Partial<ParsingTemplate>): Promise<ParsingTemplate> => {
    return apiClient.put<ParsingTemplate>(`/api/v1/parsing-templates/${templateId}`, template);
  },

  delete: async (templateId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/parsing-templates/${templateId}`);
  },
};
