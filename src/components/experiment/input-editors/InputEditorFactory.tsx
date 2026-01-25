"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { InputDataObjectType } from "@/types";
import { DataType } from "@/types";

interface Props {
  input: InputDataObjectType;
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function InputEditorFactory({ input, value, onChange }: Props) {
  switch (input.type) {
    case DataType.STRING:
      return (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${input.name}`}
          required={input.isRequired}
        />
      );

    case DataType.INTEGER:
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${input.name}`}
          required={input.isRequired}
        />
      );

    case DataType.FLOAT:
      return (
        <Input
          type="number"
          step="any"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${input.name}`}
          required={input.isRequired}
        />
      );


    case DataType.URI:
    case DataType.URI_COLLECTION:
      return (
        <div className="space-y-2">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="File path or URI"
            required={input.isRequired}
          />
          <p className="text-xs text-muted-foreground">
            Enter a file path from storage or upload a file
          </p>
        </div>
      );

    default:
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${input.name}`}
          required={input.isRequired}
          rows={3}
        />
      );
  }
}
