import { Link } from 'react-router-dom';
import { Database, Github, ExternalLink, ShieldCheck } from 'lucide-react';
import { AtlasLogo3D } from '../common/AtlasLogo3D';

export function Footer() {
  return (
    <footer className="w-full bg-[#0B1B34] text-[#E8EDF7] mt-auto border-t border-[#1C2D4A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: About */}
          <div className="space-y-3 md:col-span-1">
            <AtlasLogo3D size="sm" showSubtitle={true} />
            <p className="text-xs text-[#9AA7BD] leading-relaxed">
              A public data explorer and comparison workspace providing trustworthy macroeconomic, demographic, and development indicators across 250 sovereign nations and territories.
            </p>
          </div>

          {/* Col 2: Data Sources */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#CBD3E0]">
              <Database className="w-3.5 h-3.5 text-[#6C8DF5]" />
              <span>Data Sources</span>
            </div>
            <ul className="space-y-2 text-xs text-[#9AA7BD]">
              <li>
                <a
                  href="https://data.worldbank.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>World Bank Open Data</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/mledoze/countries"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Open Countries DB</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://flagcdn.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>FlagCDN High-Res Flags</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#CBD3E0]">
              Navigation
            </div>
            <ul className="space-y-2 text-xs text-[#9AA7BD]">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Explore Countries
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">
                  Side-by-Side Compare
                </Link>
              </li>
              <li>
                <Link to="/match" className="hover:text-white transition-colors">
                  Best-Fit Nation Matcher
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-white transition-colors">
                  Saved Benchmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Transparency & Open Access */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#CBD3E0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Open Access</span>
            </div>
            <p className="text-xs text-[#9AA7BD] leading-relaxed">
              No API keys, paywalls, or tracking required. Indicators are retrieved live from official open-data endpoints.
            </p>
            <div className="pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#E8EDF7] hover:text-white font-medium transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Open Source Repository</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer Row */}
        <div className="mt-10 pt-6 border-t border-[#1C2D4A] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A869A]">
          <p>
            Data provided by World Bank API and global open data repositories. Atlas Compare is an open-source project.
          </p>
          <p className="text-[#6B7B94] text-[11px]">
            Designed for international research, education, and public reference.
          </p>
        </div>
      </div>
    </footer>
  );
}
