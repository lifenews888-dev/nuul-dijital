/**
 * Өнөөдрийн хуваарь — artifact-ийн `aside.wg.wr` (index.html:594).
 *
 * Artifact-д `.smp` («Жишээ өгөгдөл») тэмдэглэгээ байдаг нь түүний өгөгдөл
 * кодод бичигдсэн учраас. Энд хуваарь нь УИХ-ын жинхэнэ хуваарийн бичлэг
 * тул тэр мөрийг ЗУРАХГҮЙ — байхгүй бол виджет өөрөө харагдахгүй.
 */
export function WidgetAgenda({ agenda }: { agenda: { time: string; text: string }[] }) {
  if (agenda.length === 0) return null;

  return (
    <aside className="wg wr" aria-label="Өнөөдрийн хэлэлцэх асуудал">
      <div className="lbl wk">Өнөөдөр хэлэлцэх асуудал</div>
      <ol className="ag" id="ag">
        {agenda.map((a, i) => (
          <li key={`${a.time}-${i}`}>
            <time>{a.time}</time>
            <span>{a.text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
