/** Našeptávač fotek z knihovny pro pole s adresou fotky (input list="media-list"). */
export function MediaDatalist({ media }: { media: { url: string; label: string }[] }) {
  return (
    <datalist id="media-list">
      {media.map((m) => (
        <option key={m.url} value={m.url}>{m.label}</option>
      ))}
    </datalist>
  );
}
