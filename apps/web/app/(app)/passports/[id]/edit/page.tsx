import { EditPassportClient } from "@/components/passport/EditPassportClient";

export default async function EditPassportPage(props: PageProps<"/passports/[id]/edit">) {
  const { id } = await props.params;
  return <EditPassportClient id={id} />;
}
