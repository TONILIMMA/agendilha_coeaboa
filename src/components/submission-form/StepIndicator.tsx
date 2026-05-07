import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-4 sm:py-6">
      <div className="relative mb-4 sm:mb-8">
        {/* Background Bar */}
        <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-muted rounded-full" />
        
        {/* Progress Bar */}
        <div 
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-primary rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${progress}%` }}
        />

        {/* Dots */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isActive = step.id <= currentStep;
            const isCurrent = step.id === currentStep;
            
            return (
              <div 
                key={step.id} 
                className="flex flex-col items-center"
              >
                <div 
                  className={cn(
                    "z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isActive 
                      ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                      : "bg-background border-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20 scale-110"
                  )}
                >
                  <span className="text-[10px] sm:text-xs font-bold">{step.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between px-1 sm:hidden">
        <p className="text-xs font-bold text-primary">
          Etapa {currentStep} de {steps.length}: {steps[currentStep-1].title}
        </p>
      </div>

      <div className="hidden sm:flex justify-between px-2">
        {steps.map((step) => (
          <span 
            key={step.id}
            className={cn(
              "text-[10px] uppercase tracking-wider font-bold transition-colors",
              step.id === currentStep ? "text-primary" : "text-muted-foreground"
            )}
          >
            {step.title}
          </span>
        ))}
      </div>
    </div>
  );
}
