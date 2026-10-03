import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, Flash, PageTitle, Panel, Table, fmtDate } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/client";
import { UserForms } from "@/components/admin/UserForms";
import { Icon } from "@/components/ui/Icon";
import { deleteUserAction } from "../../actions";

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireAdmin("admin");
  const sp = await searchParams;
  const d = await db();
  const users = await d.select().from(schema.adminUsers).orderBy(asc(schema.adminUsers.id));
  return (
    <>
      <PageTitle title="مدیران" subtitle="«مدیر کل» به همه بخش‌ها دسترسی دارد؛ «ویرایشگر» فقط محتوا را مدیریت می‌کند." />
      <Flash saved={sp.saved === "1"} error={sp.error === "self" ? "نمی‌توانید حساب خودتان را حذف کنید." : null} />
      <Table head={["ایمیل", "نام", "نقش", "آخرین ورود", ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3" dir="ltr">{u.email}</td>
            <td className="px-4 py-3">{u.name}</td>
            <td className="px-4 py-3">{u.role === "admin" ? <Badge tone="accent">مدیر کل</Badge> : <Badge>ویرایشگر</Badge>}</td>
            <td className="px-4 py-3 text-xs text-muted">{fmtDate(u.lastLoginAt)}</td>
            <td className="px-4 py-3 text-end">
              {u.id !== me.id ? (
                <ConfirmButton action={deleteUserAction} id={u.id} message={`${u.email} حذف شود؟`}>
                  <Icon name="trash" size={13} /> حذف
                </ConfirmButton>
              ) : (
                <span className="text-xs text-faint">شما</span>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Panel className="mt-6">
        <UserForms />
      </Panel>
    </>
  );
}
