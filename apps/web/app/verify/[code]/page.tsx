import { VerifyResultClient } from "@/components/passport/VerifyResultClient";

export default async function VerifyCodePage(props: PageProps<"/verify/[code]">) {
  const { code } = await props.params;
  return <VerifyResultClient code={code} />;
}
