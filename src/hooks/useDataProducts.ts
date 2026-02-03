"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePortalConfig } from "@/contexts/PortalConfigContext";
import { dataProductsApi, type SearchDataProductsParams } from "@/lib/api/data-products";
import type { DataProductModel } from "@/types";

export function usePublicDataProducts(nameSearch?: string, pageNumber = 0, pageSize = 20) {
  return useQuery({
    queryKey: ["data-products", "public", nameSearch, pageNumber, pageSize],
    queryFn: async () => {
      try {
        return await dataProductsApi.getPublic(nameSearch, pageNumber, pageSize);
      } catch (error) {
        console.error("Error fetching public data products:", error);
        throw error;
      }
    },
    enabled: true, // Always enabled, but can be controlled by caller
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useAccessibleDataProducts(
  userId: string,
  gatewayId: string,
  options?: { groupIds?: string[]; nameSearch?: string; pageNumber?: number; pageSize?: number }
) {
  return useQuery({
    queryKey: ["data-products", "accessible", userId, gatewayId, options?.nameSearch, options?.pageNumber, options?.pageSize],
    queryFn: () =>
      dataProductsApi.getAccessible({
        userId,
        gatewayId,
        groupIds: options?.groupIds,
        nameSearch: options?.nameSearch,
        pageNumber: options?.pageNumber ?? 0,
        pageSize: options?.pageSize ?? 50,
      }),
    enabled: !!userId && !!gatewayId,
    staleTime: 30 * 1000,
  });
}

export function useDataProducts(searchParams?: Partial<SearchDataProductsParams>) {
  const { data: session } = useSession();
  const { defaultGatewayId } = usePortalConfig();
  const gatewayId = session?.user?.gatewayId || defaultGatewayId;
  const userId = session?.user?.id || "";

  return useQuery({
    queryKey: ["data-products", searchParams],
    queryFn: () =>
      dataProductsApi.search({
        gatewayId,
        userId,
        productName: searchParams?.productName || "",
        limit: searchParams?.limit || 100,
        offset: searchParams?.offset || 0,
      }),
    enabled: !!userId,
  });
}

export function useDataProduct(productUri: string | undefined) {
  return useQuery({
    queryKey: ["data-products", productUri],
    queryFn: () => dataProductsApi.get(productUri!),
    enabled: !!productUri,
  });
}

export function useDataProductParent(productUri: string | undefined) {
  return useQuery({
    queryKey: ["data-products", productUri, "parent"],
    queryFn: () => dataProductsApi.getParent(productUri!),
    enabled: !!productUri,
  });
}

export function useDataProductChildren(productUri: string | undefined) {
  return useQuery({
    queryKey: ["data-products", productUri, "children"],
    queryFn: () => dataProductsApi.getChildren(productUri!),
    enabled: !!productUri,
  });
}

export function useCreateDataProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: Partial<DataProductModel>) => dataProductsApi.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-products"] });
    },
  });
}

export function useUpdateDataProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productUri, product }: { productUri: string; product: Partial<DataProductModel> }) =>
      dataProductsApi.update(productUri, product),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["data-products"] });
      queryClient.invalidateQueries({ queryKey: ["data-products", variables.productUri] });
    },
  });
}

export function useDeleteDataProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productUri: string) => dataProductsApi.delete(productUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-products"] });
    },
  });
}
