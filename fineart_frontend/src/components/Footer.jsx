import { FiInstagram, FiMail, FiPhone } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-neutral-800">FineArt</p>
          <p>Curating digital experiences for artists & galleries.</p>
        </div>

        <div className="flex flex-col gap-2 md:text-right">
          <a href="mailto:hello@fineart.com" className="flex items-center gap-2 hover:text-primary">
            <FiMail /> hello@fineart.com
          </a>
          <a href="tel:+820212345678" className="flex items-center gap-2 hover:text-primary">
            <FiPhone /> +82 02-1234-5678
          </a>
          <a href="https://instagram.com" className="flex items-center gap-2 hover:text-primary">
            <FiInstagram /> @fineart.gallery
          </a>
        </div>
      </div>
    </footer>
  );
}
