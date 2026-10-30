import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  Table,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { CountryListItem, CountryIndicatorSummary, IndicatorKey } from '../../types';
import { AIInsightsData } from './AIInsights';
import { INDICATOR_CONFIGS } from '../../utils/normalize';
import { formatPopulation, formatArea } from '../../utils/format';
import {
  generateMarkdownReport,
  generateCSVReport,
  downloadFile,
} from '../../utils/reportGenerator';
import { toast } from '../../store/useToastStore';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  countries: CountryListItem[];
  indicators?: Record<string, Record<IndicatorKey, CountryIndicatorSummary>>;
  insights?: AIInsightsData | null;
}

export function ReportModal({
  isOpen,
  onClose,
  countries,
  indicators,
  insights,
}: ReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || countries.length < 2) return null;

  const countryNames = countries.map((c) => c.name.common).join(' vs ');
  const filenameBase = countries.map((c) => c.cca3).join('_');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport({ countries, indicators, insights });
    downloadFile(md, `${filenameBase}_comparison_report.md`, 'text/markdown;charset=utf-8');
    toast('Markdown report downloaded', 'success');
  };

  const handleDownloadCSV = () => {
    const csv = generateCSVReport({ countries, indicators, insights });
    downloadFile(csv, `${filenameBase}_indicators_matrix.csv`, 'text/csv;charset=utf-8');
    toast('CSV data spreadsheet downloaded', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const md = generateMarkdownReport({ countries, indicators, insights });
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      toast('Full report copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0B1B34]/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#14233D] rounded-2xl shadow-2xl border border-[#CBD3E0] dark:border-[#24365A] z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDF0F5] dark:border-[#1C2D4A] bg-[#F6F7F9] dark:bg-[#0E1A2F]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 text-[#1D4ED8] dark:text-[#6C8DF5]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7]">
                Executive Benchmark Report
              </h2>
              <p className="text-xs text-[#46546C] dark:text-[#9AA7BD]">
                Comprehensive briefing ready for download or export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#7A869A] hover:text-[#0B1B34] dark:hover:text-[#E8EDF7] hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar (Download & Export buttons) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-2.5 px-5 sm:px-6 py-3 bg-white dark:bg-[#14233D] border-b border-[#EDF0F5] dark:border-[#1C2D4A]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#46546C] dark:text-[#9AA7BD]">
              Download As:
            </span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer min-h-[34px]"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF / Print</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD3E0] dark:border-[#24365A] bg-[#F0F2F6] dark:bg-[#1B2C4B] hover:bg-[#E8EEFD] text-[#0B1B34] dark:text-[#E8EDF7] text-xs font-semibold shadow-xs transition-all cursor-pointer min-h-[34px]"
              title="Download Markdown Report"
            >
              <Download className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Markdown (.md)</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD3E0] dark:border-[#24365A] bg-[#F0F2F6] dark:bg-[#1B2C4B] hover:bg-[#E8EEFD] text-[#0B1B34] dark:text-[#E8EDF7] text-xs font-semibold shadow-xs transition-all cursor-pointer min-h-[34px]"
              title="Download CSV Spreadsheet"
            >
              <Table className="w-3.5 h-3.5 text-[#0F9D8A]" />
              <span>CSV Data</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD3E0] dark:border-[#24365A] bg-white dark:bg-[#14233D] hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] text-xs font-medium text-[#46546C] dark:text-[#9AA7BD] transition-all cursor-pointer min-h-[34px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Report Document Preview */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-7 text-[#0B1B34] dark:text-[#E8EDF7] font-sans print:p-0 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b border-[#CBD3E0] dark:border-[#24365A] pb-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#1D4ED8] dark:text-[#6C8DF5]">
              <span>Atlas Compare · Official Intelligence Brief</span>
              <span>{dateStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0B1B34] dark:text-white">
              {countryNames}
            </h1>
            <p className="text-xs text-[#46546C] dark:text-[#9AA7BD]">
              Derived from live World Bank series data, Open Countries dataset, and FlagCDN repositories.
            </p>

            {/* Flags Row */}
            <div className="flex items-center gap-3 pt-2">
              {countries.map((c) => (
                <div
                  key={c.cca3}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#CBD3E0] dark:border-[#24365A]"
                >
                  <img
                    src={`https://flagcdn.com/w80/${c.cca2.toLowerCase()}.png`}
                    alt=""
                    className="w-5 h-3.5 object-cover rounded shadow-xs"
                  />
                  <span className="text-xs font-semibold">{c.name.common}</span>
                  <span className="text-[11px] text-[#7A869A] font-mono">({c.cca3})</span>
                </div>
              ))}
            </div>
          </div>

          {/* 1. AI Synthesis Section */}
          {insights && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8892B] dark:text-[#F3CA68]">
                <Sparkles className="w-4 h-4" />
                <span>Executive Synthesis & Tradeoffs</span>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#CBD3E0] dark:border-[#24365A]">
                <p className="text-sm text-[#0B1B34] dark:text-[#E8EDF7] leading-relaxed font-serif font-medium">
                  "{insights.summary}"
                </p>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {countries.map((c) => {
                  const s = insights.strengths.find(
                    (item) =>
                      item.country.toLowerCase().includes(c.name.common.toLowerCase()) ||
                      c.name.common.toLowerCase().includes(item.country.toLowerCase())
                  );
                  const w = insights.weaknesses.find(
                    (item) =>
                      item.country.toLowerCase().includes(c.name.common.toLowerCase()) ||
                      c.name.common.toLowerCase().includes(item.country.toLowerCase())
                  );

                  return (
                    <div
                      key={c.cca3}
                      className="p-4 rounded-xl border border-[#CBD3E0] dark:border-[#24365A] bg-white dark:bg-[#14233D] space-y-3 shadow-xs"
                    >
                      <h4 className="font-heading font-bold text-sm text-[#0B1B34] dark:text-[#E8EDF7] border-b border-[#EDF0F5] dark:border-[#1C2D4A] pb-2">
                        {c.name.common}
                      </h4>

                      <div>
                        <span className="text-[11px] font-bold text-[#15803D] dark:text-[#22C55E] flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Strengths</span>
                        </span>
                        <ul className="text-xs text-[#46546C] dark:text-[#9AA7BD] space-y-1 pl-1">
                          {s?.points.map((pt, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#15803D] font-bold">·</span>
                              <span>{pt}</span>
                            </li>
                          )) || <li>Solid indicator stability</li>}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-[#EDF0F5] dark:border-[#1C2D4A]">
                        <span className="text-[11px] font-bold text-[#B45309] dark:text-[#F59E0B] flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Watch-outs</span>
                        </span>
                        <ul className="text-xs text-[#46546C] dark:text-[#9AA7BD] space-y-1 pl-1">
                          {w?.points.map((pt, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#B45309] font-bold">·</span>
                              <span>{pt}</span>
                            </li>
                          )) || <li>Standard monitoring parameters</li>}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Analytical Takeaway */}
              <div className="p-4 rounded-xl border border-[#CBD3E0] dark:border-[#24365A] bg-[#FBF3E0] dark:bg-[#B8892B]/15 flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-[#B8892B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-heading font-bold text-[#B8892B] dark:text-[#F3CA68] uppercase tracking-wider block">
                    Strategic Verdict
                  </span>
                  <p className="text-xs sm:text-sm text-[#0B1B34] dark:text-[#E8EDF7] mt-0.5 font-medium leading-relaxed">
                    {insights.verdict}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Key Indicator Matrix Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-[#1D4ED8] dark:text-[#6C8DF5]">
              Core Indicator Matrix
            </h3>

            <div className="overflow-x-auto rounded-xl border border-[#CBD3E0] dark:border-[#24365A]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[#46546C] dark:text-[#9AA7BD] border-b border-[#CBD3E0] dark:border-[#24365A]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Attribute / Metric</th>
                    {countries.map((c) => (
                      <th key={c.cca3} className="py-2.5 px-4 font-bold text-[#0B1B34] dark:text-white">
                        {c.name.common}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF0F5] dark:divide-[#1C2D4A] bg-white dark:bg-[#14233D]">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[#46546C] dark:text-[#9AA7BD]">Capital City</td>
                    {countries.map((c) => (
                      <td key={c.cca3} className="py-2.5 px-4 font-medium">
                        {c.capital?.join(', ') || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[#46546C] dark:text-[#9AA7BD]">Region</td>
                    {countries.map((c) => (
                      <td key={c.cca3} className="py-2.5 px-4 font-medium">
                        {c.region}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[#46546C] dark:text-[#9AA7BD]">Population</td>
                    {countries.map((c) => (
                      <td key={c.cca3} className="py-2.5 px-4 font-mono font-semibold">
                        {formatPopulation(c.population)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[#46546C] dark:text-[#9AA7BD]">Total Area</td>
                    {countries.map((c) => (
                      <td key={c.cca3} className="py-2.5 px-4 font-mono">
                        {formatArea(c.area)}
                      </td>
                    ))}
                  </tr>
                  {indicators &&
                    (Object.keys(INDICATOR_CONFIGS) as IndicatorKey[]).map((key) => {
                      const cfg = INDICATOR_CONFIGS[key];
                      return (
                        <tr key={key}>
                          <td className="py-2.5 px-4 font-medium text-[#46546C] dark:text-[#9AA7BD]">
                            {cfg.label}
                          </td>
                          {countries.map((c) => {
                            const ind = indicators[c.cca3]?.[key];
                            const val = ind?.latestValue;
                            return (
                              <td key={c.cca3} className="py-2.5 px-4 font-mono font-semibold">
                                {val !== null && val !== undefined
                                  ? `${val.toLocaleString()} ${cfg.unit}`
                                  : 'N/A'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer citation */}
          <div className="pt-4 border-t border-[#EDF0F5] dark:border-[#1C2D4A] text-center text-[11px] text-[#7A869A]">
            Report generated by Atlas Compare · Live verified data from World Bank API & Open Datasets
          </div>
        </div>
      </div>
    </div>
  );
}
