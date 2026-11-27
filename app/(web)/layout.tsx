import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { PlayerProvider } from "@/components/player/PlayerProvider";

/** Veřejný web: hlavička, patička a přehrávač. Administrace (/admin) má vlastní layout. */
export default function WebLayout({ children }: LayoutProps<"/">) {
  return (
    <PlayerProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MiniPlayer />
    </PlayerProvider>
  );
}
