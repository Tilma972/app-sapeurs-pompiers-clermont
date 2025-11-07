"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label unused; FormLabel provides label styling
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateUserProfileClient } from "@/lib/supabase/profile-client";
import { Profile, ProfileWithTeamId } from "@/lib/types/profile";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface TeamOption { id: string; nom: string }
interface ProfileFormProps {
  profile: Profile;
  teamOptions?: TeamOption[];
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(80, "Nom trop long"),
  team_id: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

type FormValues = z.infer<typeof schema>;

// FICHIER SUPPRIMÉ : remplacé par unified-profile-form.tsx
