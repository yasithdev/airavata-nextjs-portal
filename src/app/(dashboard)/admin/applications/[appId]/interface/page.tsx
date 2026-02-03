"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationInterface } from "@/hooks";
import { toast } from "@/hooks/useToast";

export default function ApplicationInterfacePage() {
  const params = useParams();
  const appId = params.appId as string;

  const { data: appInterface, isLoading } = useApplicationInterface(appId);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!appInterface) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Application interface not found</h2>
        <Button asChild className="mt-4">
          <Link href={`/catalog/APPLICATION/${appId}`}>Back to Application</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/catalog/APPLICATION/${appId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{appInterface.applicationName}</h1>
          <p className="text-muted-foreground">Configure application interface</p>
        </div>
      </div>

      <Tabs defaultValue="inputs">
        <TabsList>
          <TabsTrigger value="inputs">Input Fields</TabsTrigger>
          <TabsTrigger value="outputs">Output Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Input Fields</h3>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Input
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {appInterface.applicationInputs && appInterface.applicationInputs.length > 0 ? (
                <div className="space-y-3">
                  {appInterface.applicationInputs.map((input, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{input.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {input.userFriendlyDescription}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{input.type}</Badge>
                            {input.isRequired && <Badge>Required</Badge>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No input fields defined
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outputs" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Output Fields</h3>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Output
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {appInterface.applicationOutputs && appInterface.applicationOutputs.length > 0 ? (
                <div className="space-y-3">
                  {appInterface.applicationOutputs.map((output, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{output.name}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{output.type}</Badge>
                            {output.isRequired && <Badge>Required</Badge>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No output fields defined
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
