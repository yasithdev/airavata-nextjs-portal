"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfigureApplicationStep } from "./steps/ConfigureApplicationStep";
import { ConfigureRuntimeStep } from "./steps/ConfigureRuntimeStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ExperimentStepper } from "./ExperimentStepper";
import { useCreateExperiment, useLaunchExperiment, useApplicationInterface } from "@/hooks";
import type { ExperimentModel, ApplicationInterfaceDescription, InputDataObjectType, ComputationalResourceSchedulingModel } from "@/types";
import { ExperimentType } from "@/types";
import { toast } from "@/hooks/useToast";
import { getExperimentPermalink } from "@/lib/permalink";
import { usePortalConfig } from "@/contexts/PortalConfigContext";

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
  { id: 1, name: "Configure Application", description: "Select application and configure inputs" },
  { id: 2, name: "Configure Runtime", description: "Select compute resource and queue settings" },
  { id: 3, name: "Review", description: "Review and launch" },
];

interface CreateExperimentWizardProps {
  initialApplication?: ApplicationInterfaceDescription;
  initialProjectId?: string;
  onClose?: () => void;
}

export function CreateExperimentWizard({ 
  initialApplication,
  initialProjectId,
  onClose,
}: CreateExperimentWizardProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { defaultGatewayId } = usePortalConfig();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Get appId from URL if present
  const appIdFromUrl = searchParams?.get("appId");
  const { data: applicationFromUrl } = useApplicationInterface(appIdFromUrl || "");
  
  // Determine the initial application: prop > URL > undefined
  const effectiveInitialApplication = initialApplication || applicationFromUrl;
  
  const [wizardData, setWizardData] = useState<WizardData>({
    experimentName: "",
    description: "",
    inputs: [],
    projectId: initialProjectId || searchParams?.get("projectId") || undefined,
    application: effectiveInitialApplication,
  });

  // Update wizard data when initial application is loaded or changes
  useEffect(() => {
    if (effectiveInitialApplication) {
      setWizardData((prev) => {
        // Only update if the application is different to avoid unnecessary re-renders
        if (prev.application?.applicationInterfaceId !== effectiveInitialApplication.applicationInterfaceId) {
          return {
            ...prev,
            application: effectiveInitialApplication,
            experimentName: `${effectiveInitialApplication.applicationName} Experiment`,
            inputs: effectiveInitialApplication.applicationInputs || [],
          };
        }
        return prev;
      });
    }
  }, [effectiveInitialApplication]);

  // Update projectId if it changes in URL or prop
  useEffect(() => {
    const projectId = initialProjectId || searchParams?.get("projectId");
    if (projectId) {
      setWizardData((prev) => ({ ...prev, projectId }));
    }
  }, [searchParams, initialProjectId]);

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
      const gatewayId = session?.user?.gatewayId || defaultGatewayId;
      const userName = session?.user?.email || "admin";

      if (!wizardData.projectId) {
        throw new Error("Project is required. Please select a project.");
      }

      const experiment: Partial<ExperimentModel> = {
        projectId: wizardData.projectId,
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

      // Close modal if it was opened in a modal, otherwise navigate
      if (onClose) {
        onClose();
        // Small delay to allow modal to close before navigation
        setTimeout(() => {
          router.push(getExperimentPermalink(result.experimentId));
        }, 100);
      } else {
        router.push(getExperimentPermalink(result.experimentId));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create experiment",
        variant: "destructive",
      });
    }
  };

  const isModalMode = !!onClose;

  const stepContent = (
    <div className="space-y-6">
      {currentStep === 1 && (
        <ConfigureApplicationStep
          data={wizardData}
          onUpdate={updateWizardData}
          onNext={nextStep}
        />
      )}
      {currentStep === 2 && (
        <ConfigureRuntimeStep
          data={wizardData}
          onUpdate={updateWizardData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === 3 && (
        <ReviewStep
          data={wizardData}
          onBack={prevStep}
          onSubmit={handleSubmit}
          isSubmitting={createExperiment.isPending || launchExperiment.isPending}
        />
      )}
    </div>
  );

  if (isModalMode) {
    return (
      <div className="space-y-6">
        <div>
          <ExperimentStepper steps={steps} currentStep={currentStep} />
        </div>
        {stepContent}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <ExperimentStepper steps={steps} currentStep={currentStep} />
      </CardHeader>
      <CardContent>
        {stepContent}
      </CardContent>
    </Card>
  );
}
