
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const requestAccessFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  email: z.string().email(),
  newsletter: z.boolean(),
  whatsapp: z.boolean(),
});

export function RequestAccessForm({ onCancel }: { onCancel: () => void }) {
  const form = useForm<z.infer<typeof requestAccessFormSchema>>({
    resolver: zodResolver(requestAccessFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      newsletter: false,
      whatsapp: false,
    },
  });

  function onSubmit(values: z.infer<typeof requestAccessFormSchema>) {
    console.log(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="flex-grow">
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Firstname *" {...form.register("firstName")} />
          <Input placeholder="Lastname *" {...form.register("lastName")} />
        </div>
        <Input placeholder="Phone *" {...form.register("phone")} />
        <Input placeholder="Email *" {...form.register("email")} />

        <Checkbox
          id="newsletter"
          label="Sign me up to the CreativeLab newsletter"
          {...form.register("newsletter")}
        />
        <Checkbox
          id="whatsapp"
          label="By submitting this form I agree to be contacted via WhatsApp"
          {...form.register("whatsapp")}
        />
      </div>
      <div className="flex gap-4 mt-auto">
        <Button variant="outline" onClick={onCancel} className="w-full">Cancel</Button>
        <Button type="submit" className="w-full">Submit</Button>
      </div>
    </form>
  );
}
