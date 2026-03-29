import { revalidatePath } from "next/cache";

export function revalidatePatientWorkspace(patientId: string) {
  const basePath = `/patients/${patientId}`;

  revalidatePath(basePath);
  revalidatePath(`${basePath}/visits`);
  revalidatePath(`${basePath}/meal-plans`);
  revalidatePath(`${basePath}/timeline`);
  revalidatePath(`${basePath}/notes`);
  revalidatePath(`${basePath}/report`);
  revalidatePath(`${basePath}/edit`);
}
