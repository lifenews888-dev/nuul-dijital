import { saveTeamMember } from "@/app/(private)/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar: string;
  socials: unknown;
  order: number;
  active: boolean;
};

export function TeamForm({ member }: { member?: TeamMember }) {
  return (
    <form action={saveTeamMember} className="max-w-2xl">
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Нэр" defaultValue={member?.name} required />
          <TextField name="role" label="Албан тушаал" defaultValue={member?.role} required />
        </div>
        <ImageField name="avatar" label="Зураг" defaultValue={member?.avatar} required hint="JPG, PNG — 4MB хүртэл" />
        <TextAreaField name="bio" label="Намтар" defaultValue={member?.bio ?? ""} rows={3} />
        <TextAreaField
          name="socials"
          label="Сошиал холбоосууд (JSON)"
          defaultValue={member?.socials ? JSON.stringify(member.socials, null, 2) : ""}
          hint='Жишээ: { "linkedin": "https://...", "twitter": "https://..." }'
          rows={4}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="order" label="Дараалал" type="number" defaultValue={member?.order ?? 0} />
        </div>
        <CheckboxField name="active" label="Идэвхтэй (харагдана)" defaultChecked={member?.active ?? true} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {member ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
