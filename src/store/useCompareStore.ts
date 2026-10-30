import { create } from 'zustand';
import { CountryListItem } from '../types';
import { toast } from './useToastStore';

export const COMPARE_COLORS = [
  '#1D4ED8', // Royal Blue (Country 1)
  '#0F9D8A', // Teal (Country 2)
  '#E8590C', // Warm Orange (Country 3)
];

interface CompareState {
  selectedCountries: CountryListItem[];
  addCountry: (country: CountryListItem) => boolean;
  removeCountry: (cca3: string) => void;
  toggleCountry: (country: CountryListItem) => void;
  clearAll: () => void;
  setCountries: (countries: CountryListItem[]) => void;
  isCountrySelected: (cca3: string) => boolean;
  getCountryColor: (cca3: string) => string;
  getCountryIndex: (cca3: string) => number;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  selectedCountries: [],

  addCountry: (country) => {
    const { selectedCountries } = get();
    if (selectedCountries.some((c) => c.cca3 === country.cca3)) {
      return true; // Already selected
    }
    if (selectedCountries.length >= 3) {
      toast('You can compare up to 3 countries', 'warning');
      return false;
    }
    set({ selectedCountries: [...selectedCountries, country] });
    return true;
  },

  removeCountry: (cca3) => {
    set((state) => ({
      selectedCountries: state.selectedCountries.filter((c) => c.cca3 !== cca3),
    }));
  },

  toggleCountry: (country) => {
    const { selectedCountries, removeCountry, addCountry } = get();
    if (selectedCountries.some((c) => c.cca3 === country.cca3)) {
      removeCountry(country.cca3);
    } else {
      addCountry(country);
    }
  },

  clearAll: () => {
    set({ selectedCountries: [] });
  },

  setCountries: (countries) => {
    set({ selectedCountries: countries.slice(0, 3) });
  },

  isCountrySelected: (cca3) => {
    return get().selectedCountries.some((c) => c.cca3 === cca3);
  },

  getCountryIndex: (cca3) => {
    return get().selectedCountries.findIndex((c) => c.cca3 === cca3);
  },

  getCountryColor: (cca3) => {
    const idx = get().getCountryIndex(cca3);
    if (idx >= 0 && idx < COMPARE_COLORS.length) {
      return COMPARE_COLORS[idx];
    }
    return COMPARE_COLORS[0];
  },
}));
