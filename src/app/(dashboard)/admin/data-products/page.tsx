"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Trash2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataProductsApi } from "@/lib/api";
import { toast } from "@/hooks/useToast";
import type { DataProductModel, DataProductType } from "@/types";
import { useRouter } from "next/navigation";

export default function DataProductsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
  const userId = session?.user?.userName || session?.user?.userId || session?.user?.email || "default-admin";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<DataProductModel | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<DataProductModel | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<DataProductModel>>({
    gatewayId,
    ownerName: userId,
    productName: "",
    productDescription: "",
    dataProductType: "FILE" as DataProductType,
  });

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["data-products", gatewayId, userId, searchQuery],
    queryFn: () => {
      return dataProductsApi.search({
        gatewayId,
        userId,
        productName: searchQuery.trim() || "", // Allow empty search to list all products
        limit: 100,
        offset: 0,
      });
    },
    enabled: !!gatewayId && !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (product: Partial<DataProductModel>) => dataProductsApi.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-products"] });
      toast({
        title: "Data product created",
        description: "Data product has been created successfully.",
      });
      setIsCreateOpen(false);
      setNewProduct({
        gatewayId,
        ownerName: userId,
        productName: "",
        productDescription: "",
        dataProductType: "FILE" as DataProductType,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create data product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ productUri, product }: { productUri: string; product: Partial<DataProductModel> }) =>
      dataProductsApi.update(productUri, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-products"] });
      toast({
        title: "Data product updated",
        description: "Data product has been updated successfully.",
      });
      setViewingProduct(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update data product",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productUri: string) => dataProductsApi.delete(productUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-products"] });
      toast({
        title: "Data product deleted",
        description: "Data product has been deleted successfully.",
      });
      setDeletingProduct(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete data product",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    // Allow empty search to list all products
    refetch();
  };

  const handleCreate = () => {
    if (!newProduct.productName?.trim()) {
      toast({
        title: "Validation error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newProduct);
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    deleteMutation.mutate(deletingProduct.productUri);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Products</h1>
          <p className="text-muted-foreground">
            Manage data products and their replica locations
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Data Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Data Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by product name (leave empty to list all)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : products && products.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Replicas</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.productUri}>
                  <TableCell className="font-medium">{product.productName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.dataProductType}</Badge>
                  </TableCell>
                  <TableCell>{product.ownerName}</TableCell>
                  <TableCell>
                    {product.productSize
                      ? `${(product.productSize / 1024 / 1024).toFixed(2)} MB`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{product.replicaLocations?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingProduct(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/data-products/${encodeURIComponent(product.productUri)}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {searchQuery
              ? "No data products found. Try a different search term."
              : "No data products found. Create a new data product or search for existing ones."}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Data Product</DialogTitle>
            <DialogDescription>
              Create a new data product entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Product Name *</label>
              <Input
                value={newProduct.productName || ""}
                onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newProduct.productDescription || ""}
                onChange={(e) => setNewProduct({ ...newProduct, productDescription: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newProduct.dataProductType || "FILE"}
                onChange={(e) => setNewProduct({ ...newProduct, dataProductType: e.target.value as DataProductType })}
              >
                <option value="FILE">File</option>
                <option value="COLLECTION">Collection</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.productName}</DialogTitle>
            <DialogDescription>Data product details</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Product URI</p>
                <p className="font-mono text-sm break-all">{viewingProduct.productUri}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge>{viewingProduct.dataProductType}</Badge>
              </div>
              {viewingProduct.productDescription && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{viewingProduct.productDescription}</p>
                </div>
              )}
              {viewingProduct.replicaLocations && viewingProduct.replicaLocations.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Replica Locations</p>
                  <div className="space-y-2">
                    {viewingProduct.replicaLocations.map((replica, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <p className="font-medium">{replica.storageResourceId}</p>
                          {replica.filePath && (
                            <p className="text-sm text-muted-foreground font-mono">{replica.filePath}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.productName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
