"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { dataProductsApi, type SearchDataProductsParams } from "@/lib/api/data-products";
import type { DataProductModel } from "@/types";

export function useDataProducts(searchParams?: Partial<SearchDataProductsParams>) {
  const { data: session } = useSession();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
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
