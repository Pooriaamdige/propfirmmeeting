import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { FirmEditor } from "@/components/admin/FirmEditor";
import { emptyFirm, type FirmFormValue } from "@/lib/firm-defaults";

export default async function EditFirm({ params }: PageProps<"/admin/prop-firms/[id]">) {
  const { id } = await params;
  let initial: FirmFormValue = emptyFirm();
  let dbId: number | null = null;
  if (id !== "new") {
    const d = await db();
    const [row] = await d.select().from(schema.propFirms).where(eq(schema.propFirms.id, Number(id)));
    if (!row) notFound();
    dbId = row.id;
    initial = { slug: row.slug, name: row.name, published: row.published, featured: row.featured, sortOrder: row.sortOrder, data: row.data };
  }
  return (
    <>
      <PageTitle title={dbId ? `ویرایش ${initial.name}` : "پراپ‌فرم جدید"} back={{ href: "/admin/prop-firms/", label: "پراپ‌فرم‌ها" }} />
      <FirmEditor initial={initial} id={dbId} />
    </>
  );
}
