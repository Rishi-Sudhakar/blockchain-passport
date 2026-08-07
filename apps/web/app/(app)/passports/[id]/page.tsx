import { PassportDetailClient } from "@/components/passport/PassportDetailClient";

export default async function PassportDetailPage(props: PageProps<"/passports/[id]">) {
  const { id } = await props.params;
  return <PassportDetailClient id={id} />;
}
