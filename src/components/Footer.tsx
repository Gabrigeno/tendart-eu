// Footer comune a landing e Library (non nel lettore fanzine, che è a tutto schermo)
export default function Footer() {
  return (
    <footer className="text-sora bg-black" style={{ borderTop: '2px solid #00f5d4' }}>
      <div className="mx-auto w-full max-w-screen-xl p-6 md:flex md:items-center md:justify-between">
        <span className="text-sm text-gray-400 sm:text-center">© 2026 Tendart</span>
        <ul className="mt-3 flex flex-wrap items-center text-sm font-medium text-gray-400 sm:mt-0">
          <li>
            <a href="https://instagram.com/_tendart_/?hl=it" className="me-4 transition-colors hover:text-[#ff0054] md:me-6">Insta!</a>
          </li>
          <li>
            <a href="https://www.youtube.com/@TendArtLab" className="me-4 transition-colors hover:text-[#ff0054] md:me-6">YouTube</a>
          </li>
          <li>
            <a href="https://soundcloud.com/tendart" className="me-4 transition-colors hover:text-[#ff0054] md:me-6">SoundCloud</a>
          </li>
          <li>
            <a href="mailto:tendart01@gmail.com" className="transition-colors hover:text-[#ff0054]">Contattaci</a>
          </li>
        </ul>
      </div>
      <div className="px-6 pb-6 text-left">
        <span className="text-xs text-gray-500">
          Sito realizzato con ⚡ da{' '}
          <a className="transition-colors hover:text-[#00f5d4]" href="https://github.com/Gabrigeno">
            GabriGeno
          </a>
        </span>
      </div>
    </footer>
  );
}
