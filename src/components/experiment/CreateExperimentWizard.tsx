"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApplicationSelectStep } from "./steps/ApplicationSelectStep";
import { InputConfigurationStep } from "./steps/InputConfigurationStep";
import { ComputeResourceStep } from "./steps/ComputeResourceStep";
import { QueueSettingsStep } from "./steps/QueueSettingsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { useCreateExperiment, useLaunchExperiment } from "@/hooks";
import type { ExperimentModel, ApplicationInterfaceDescription, InputDataObjectType, ComputationalResourceSchedulingModel } from "@/types";
import { ExperimentType } from "@/types";
import { toast } from "@/hooks/useToast";

interface WizardData {
  projectId?: string;
  experimentName: string;
  description: string;
  application?: ApplicationInterfaceDescription;
  applicationDeploymentId?: string;
  inputs: InputDataObjectType[];
  computeResourceId?: string;
  scheduling?: ComputationalResourceSchedulingModel;
  groupResourceProfileId?: string;
}

const steps = [
  { id: 1, name: "Select Application", description: "Choose the application to run" },
  { id: 2, name: "Configure Inputs", description: "Set input parameters and files" },
  { id: 3, name: "Compute Resource", description: "Select where to run" },
  { id: 4, name: "Queue Settings", description: "Configure job settings" },
  { id: 5, name: "Review", description: "Review and launch" },
];

export function CreateExperimentWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    experimentName: "",
    description: "",
    inputs: [],
  });

  const createExperiment = useCreateExperiment();
  const launchExperiment = useLaunchExperiment();

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (launchImmediately: boolean) => {
    try {
      const gatewayId = session?.user?.gatewayId || process.env.NEXT_PUBLIC_DEFAULT_GATEWAY_ID || "default";
      const userName = session?.user?.email || "admin";

      const experiment: Partial<ExperimentModel> = {
        projectId: wizardData.projectId || "DEFAULT",
        gatewayId,
        experimentType: ExperimentType.SINGLE_APPLICATION,
        userName,
        experimentName: wizardData.experimentName,
        description: wizardData.description,
        experimentInputs: wizardData.inputs,
        userConfigurationData: {
          computationalResourceScheduling: wizardData.scheduling,
          groupResourceProfileId: wizardData.groupResourceProfileId,
        },
      };

      const result = await createExperiment.mutateAsync(experiment);
      
      // Create a process for the experiment with the selected application and deployment
      if (wizardData.application?.applicationInterfaceId && wizardData.applicationDeploymentId && result.experimentId) {
        try {
          const { processesApi } = await import("@/lib/api");
          const processResult = await processesApi.create(
            {
              applicationInterfaceId: wizardData.application.applicationInterfaceId,
              applicationDeploymentId: wizardData.applicationDeploymentId,
              computeResourceId: wizardData.computeResourceId,
              processInputs: wizardData.inputs,
            },
            result.experimentId
          );
          
          // Create resource schedule for the process if provided
          if (wizardData.scheduling && processResult.processId) {
            try {
              await processesApi.createResourceSchedule(processResult.processId, wizardData.scheduling);
            } catch (scheduleError) {
              console.error("Failed to create process resource schedule:", scheduleError);
              // Continue - schedule might be optional
            }
          }
        } catch (processError) {
          console.error("Failed to create process:", processError);
          // Don't show error toast - process might be created automatically on launch
        }
      }

      toast({
        title: "Experiment created",
        description: `Experiment ${result.experimentId} has been created successfully.`,
      });

      if (launchImmediately) {
        await launchExperiment.mutateAsync(result.experimentId);
        toast({
          title: "Experiment launched",
          description: "Your experiment has been submitted for execution.",
        });
      }

      router.push(`/experiments/${result.experimentId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create experiment",
        variant: "destructive",
      });
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}</CardTitle>
        <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {currentStep === 1 && (
            <ApplicationSelectStep
              data={wizardData}
              onUpdate={updateWizardData}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <InputConfigurationStep
              data={wizardData}
              onUpdate={updateWizardData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <ComputeResourceStep
              data={wizardData}
              onUpdate={updateWizardData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <QueueSettingsStep
              data={wizardData}
              onUpdate={updateWizardData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && (
            <ReviewStep
              data={wizardData}
              onBack={prevStep}
              onSubmit={handleSubmit}
              isSubmitting={createExperiment.isPending || launchExperiment.isPending}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
