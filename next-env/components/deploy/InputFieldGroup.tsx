"use client";

import { type ComponentProps, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type InputFieldgroupProps = {
  name: string;
  placeholder: string;
  description: string;
} & Pick<
  ComponentProps<"input">,
  "minLength" | "maxLength" | "required" | "pattern"
>;

export function InputFieldgroup({
  name,
  placeholder,
  description,
  ...inputProps
}: InputFieldgroupProps) {
  const router = useRouter();
  const [invalid, setInvalid] = useState(false);

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="fieldgroup-name" className="text-2xl">
          {name}
        </FieldLabel>
        <Input
          id="fieldgroup-name"
          name={name}
          placeholder={placeholder}
          className="h-14 text-xl md:text-xl"
          aria-invalid={invalid}
          onChange={(e) =>
            setInvalid(
              e.currentTarget.value.length > 0 &&
                !e.currentTarget.validity.valid,
            )
          }
          {...inputProps}
        />
      </Field>
      <FieldDescription className="text-lg font-light text-muted-foreground/70">
        {description}
      </FieldDescription>
      <Field orientation="horizontal">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="secondary-button"
        >
          Cancel
        </Button>
        <Button disabled={invalid} type="submit" className="primary-button">
          Submit
        </Button>
      </Field>
    </FieldGroup>
  );
}
